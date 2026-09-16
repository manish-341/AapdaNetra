"""
AapdaNetra AI Service — Landslide Model Training (v3 — Real Government Data Only)
Trains RandomForest and XGBoost on real GSI/NDMA geological survey data.
Sources:
  - landslide_training_dataset.csv  (15,000 samples — GSI, NDMA, Copernicus DEM, Sentinel-2)
  - india_hazard_master_training_dataset.csv  (additional landslide-labeled sites)
Exports: calibrated model, feature list, comparison report, and percentile thresholds.
"""
import numpy as np
import pandas as pd
from sklearn.model_selection import StratifiedGroupKFold, train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
)
import xgboost as xgb
import joblib
import time
import os
import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
import json


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "..", "data")
MODELS_DIR = os.path.join(BASE_DIR, "..", "models")
ROOT_MODELS_DIR = os.path.join(BASE_DIR, "..", "..", "models")

# ── Real government-sourced datasets only ────────────────────────────────────
PRIMARY_DATA = os.path.join(DATA_DIR, "landslide_training_dataset.csv")
MASTER_DATA  = os.path.join(DATA_DIR, "india_hazard_master_training_dataset.csv")

# Feature columns from the GSI/NDMA real dataset
FEATURE_COLS = [
    "elevation_m", "slope_deg", "aspect_deg", "curvature",
    "slope_instability_index",
    "annual_rainfall_mm", "monsoon_rainfall_mm", "max_daily_rainfall_mm",
    "dist_to_road_km", "dist_to_river_km", "ndvi",
]

LULC_COLS = [
    "lulc_Agricultural", "lulc_Barren", "lulc_Barren_Rocky", "lulc_Barren_Sandy",
    "lulc_Dense_Forest", "lulc_Grassland", "lulc_Open_Forest", "lulc_Plantation",
    "lulc_Scrubland", "lulc_Settlement", "lulc_Water_Body", "lulc_Wetland",
]

TARGET_COL = "landslide_label"


def load_and_merge_data():
    """Load and merge all real government-sourced landslide datasets."""
    frames = []

    # 1. Primary GSI/NDMA training dataset
    if os.path.exists(PRIMARY_DATA):
        df_primary = pd.read_csv(PRIMARY_DATA)
        print(f"  [+] landslide_training_dataset.csv : {len(df_primary):,} rows")
        frames.append(df_primary)
    else:
        raise FileNotFoundError(f"Primary training data not found: {PRIMARY_DATA}")

    # 2. Master multi-hazard dataset — extract landslide-relevant columns
    if os.path.exists(MASTER_DATA):
        df_master = pd.read_csv(MASTER_DATA)
        all_desired = FEATURE_COLS + LULC_COLS
        master_cols_available = [c for c in all_desired if c in df_master.columns]
        if TARGET_COL in df_master.columns and len(master_cols_available) > 5:
            keep_cols = master_cols_available + [TARGET_COL]
            if "state" in df_master.columns:
                keep_cols.append("state")
            if "district" in df_master.columns:
                keep_cols.append("district")
            df_master_ls = df_master[keep_cols].copy()
            print(f"  [+] india_hazard_master (landslide) : {len(df_master_ls):,} rows")
            frames.append(df_master_ls)

    df = pd.concat(frames, ignore_index=True, sort=False)
    print(f"\n  Total merged rows: {len(df):,}")
    return df


def prepare_features(df):
    """Prepare the feature matrix from real GSI data."""
    all_features = FEATURE_COLS + LULC_COLS

    # Convert boolean LULC columns to int
    for c in LULC_COLS:
        if c in df.columns:
            df[c] = df[c].astype(str).str.strip().str.lower().map(
                {"true": 1, "1": 1, "false": 0, "0": 0}
            ).fillna(0).astype(int)

    # Convert numeric columns
    for c in FEATURE_COLS:
        if c in df.columns:
            df[c] = pd.to_numeric(df[c], errors="coerce")

    # Fill missing columns
    for c in all_features:
        if c not in df.columns:
            df[c] = 0.0

    # Fill NaN with column median
    for c in all_features:
        med = df[c].median()
        df[c] = df[c].fillna(med if pd.notna(med) else 0.0)

    return all_features


def compute_thresholds(df, feature_cols):
    """Compute percentile thresholds from training data for the weather risk adjuster."""
    thresholds = {}
    percentiles = [10, 25, 50, 75, 85, 90, 95]
    for col in feature_cols:
        if col in df.columns and col not in LULC_COLS:
            vals = df[col].dropna()
            if len(vals) > 10:
                thresholds[col] = {
                    f"p{p}": round(float(np.percentile(vals, p)), 4)
                    for p in percentiles
                }
                thresholds[col]["mean"] = round(float(vals.mean()), 4)
                thresholds[col]["std"] = round(float(vals.std()), 4)
    return thresholds


def train_and_compare():
    print("=" * 70)
    print("  AAPDANETRA LANDSLIDE MODEL v3 — REAL GOVERNMENT DATA TRAINING")
    print("  Sources: GSI, NDMA, Copernicus DEM, Sentinel-2 NDVI")
    print("=" * 70)

    # ── Load data ────────────────────────────────────────────────────────
    df = load_and_merge_data()
    feature_cols = prepare_features(df)

    # Ensure target exists and is binary
    if TARGET_COL not in df.columns:
        if "landslide" in df.columns:
            df[TARGET_COL] = df["landslide"].astype(int)
        else:
            raise ValueError(f"Target column '{TARGET_COL}' not found in data")

    df[TARGET_COL] = pd.to_numeric(df[TARGET_COL], errors="coerce").fillna(0).astype(int)

    X = df[feature_cols].values
    y = df[TARGET_COL].values

    print(f"\n  Features ({len(feature_cols)}): {feature_cols[:6]}... + {len(LULC_COLS)} LULC")
    print(f"  Target distribution: {y.sum():,} landslide / {(1-y).sum():,.0f} stable "
          f"({y.mean()*100:.1f}% positive)")

    # ── Spatial-aware split ──────────────────────────────────────────────
    if "district" in df.columns:
        groups = df["district"].fillna("unknown").values
        sgkf = StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=42)
        train_idx, test_idx = next(sgkf.split(X, y, groups))
        X_train, X_test = X[train_idx], X[test_idx]
        y_train, y_test = y[train_idx], y[test_idx]
        print(f"  Split: Spatial-aware (StratifiedGroupKFold by district)")
    else:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.20, random_state=42, stratify=y
        )
        print(f"  Split: Stratified random 80/20")

    print(f"  Train: {len(X_train):,}  |  Test: {len(X_test):,}")

    results = {}

    # ── 1. RandomForest ──────────────────────────────────────────────────
    print("\n--- [1] Training RandomForest Classifier ---")
    rf = RandomForestClassifier(
        n_estimators=300, max_depth=14, min_samples_split=5,
        min_samples_leaf=3, random_state=42, n_jobs=-1
    )
    t0 = time.time()
    rf.fit(X_train, y_train)
    rf_t = time.time() - t0

    rf_pred = rf.predict(X_test)
    rf_prob = rf.predict_proba(X_test)[:, 1]
    results["RandomForest"] = {
        "accuracy": round(float(accuracy_score(y_test, rf_pred)), 4),
        "precision": round(float(precision_score(y_test, rf_pred, zero_division=0)), 4),
        "recall": round(float(recall_score(y_test, rf_pred, zero_division=0)), 4),
        "f1": round(float(f1_score(y_test, rf_pred, zero_division=0)), 4),
        "roc_auc": round(float(roc_auc_score(y_test, rf_prob)), 4),
        "train_time_s": round(float(rf_t), 3),
    }

    # ── 2. XGBoost ───────────────────────────────────────────────────────
    print("--- [2] Training XGBoost Classifier ---")
    xgb_m = xgb.XGBClassifier(
        n_estimators=300, max_depth=7, learning_rate=0.06,
        subsample=0.85, colsample_bytree=0.8, reg_alpha=0.1, reg_lambda=1.0,
        random_state=42, eval_metric="logloss", verbosity=0
    )
    t0 = time.time()
    xgb_m.fit(X_train, y_train)
    xgb_t = time.time() - t0

    xgb_pred = xgb_m.predict(X_test)
    xgb_prob = xgb_m.predict_proba(X_test)[:, 1]
    results["XGBoost"] = {
        "accuracy": round(float(accuracy_score(y_test, xgb_pred)), 4),
        "precision": round(float(precision_score(y_test, xgb_pred, zero_division=0)), 4),
        "recall": round(float(recall_score(y_test, xgb_pred, zero_division=0)), 4),
        "f1": round(float(f1_score(y_test, xgb_pred, zero_division=0)), 4),
        "roc_auc": round(float(roc_auc_score(y_test, xgb_prob)), 4),
        "train_time_s": round(float(xgb_t), 3),
    }

    # ── 3. Select best ───────────────────────────────────────────────────
    print("\n" + "=" * 70)
    print(f" {'Metric':<25} {'RandomForest':<20} {'XGBoost':<20}")
    print(" " + "-" * 65)
    for metric in ["accuracy", "precision", "recall", "f1", "roc_auc", "train_time_s"]:
        print(f" {metric:<25} {str(results['RandomForest'][metric]):<20} {str(results['XGBoost'][metric]):<20}")

    rf_score = results["RandomForest"]["f1"] + results["RandomForest"]["roc_auc"]
    xgb_score = results["XGBoost"]["f1"] + results["XGBoost"]["roc_auc"]
    best_name = "XGBoost" if xgb_score >= rf_score else "RandomForest"
    best_model = xgb_m if best_name == "XGBoost" else rf
    print(f"\n>>> BEST MODEL: {best_name} (F1+AUC = {max(rf_score, xgb_score):.4f})")

    # ── 4. Calibrate ─────────────────────────────────────────────────────
    print("\n--- [3] Calibrating probabilities (Platt scaling) ---")
    calibrated = CalibratedClassifierCV(best_model, cv=3, method="sigmoid")
    calibrated.fit(X_train, y_train)
    cal_prob = calibrated.predict_proba(X_test)[:, 1]
    cal_pred = (cal_prob >= 0.5).astype(int)
    results["Calibrated"] = {
        "accuracy": round(accuracy_score(y_test, cal_pred), 4),
        "f1": round(f1_score(y_test, cal_pred, zero_division=0), 4),
        "roc_auc": round(roc_auc_score(y_test, cal_prob), 4),
    }
    print(f"  Calibrated F1={results['Calibrated']['f1']}, AUC={results['Calibrated']['roc_auc']}")

    # ── 5. Thresholds ────────────────────────────────────────────────────
    thresholds = compute_thresholds(df, feature_cols)

    # ── 6. Feature importances ───────────────────────────────────────────
    if hasattr(best_model, "feature_importances_"):
        fi = best_model.feature_importances_
        print("\n  Top 8 Decision Drivers:")
        sorted_fi = sorted(zip(feature_cols, fi), key=lambda x: x[1], reverse=True)
        for col_name, score in sorted_fi[:8]:
            bar = "#" * int(score * 40)
            print(f"    {col_name:<30} {score*100:5.1f}%  {bar}")

    # ── 7. Save ──────────────────────────────────────────────────────────
    report = {
        "model": "landslide",
        "version": "v3.0",
        "dataset_source": "GSI Landslide Atlas, NDMA Incident Records, Copernicus DEM GLO-30, Sentinel-2 NDVI",
        "datasets_used": [
            "landslide_training_dataset.csv",
            "india_hazard_master_training_dataset.csv (landslide subset)",
        ],
        "synthetic_data_used": False,
        "samples_count": len(df),
        "train_count": len(X_train),
        "test_count": len(X_test),
        "best": best_name,
        "features": feature_cols,
        "results": results,
        "positive_ratio": round(float(y.mean()), 4),
        "spatial_split": "district" in df.columns,
    }

    for target_dir in [MODELS_DIR, ROOT_MODELS_DIR]:
        os.makedirs(target_dir, exist_ok=True)
        joblib.dump(calibrated, os.path.join(target_dir, "landslide_model.joblib"))
        joblib.dump(feature_cols, os.path.join(target_dir, "landslide_features.joblib"))
        with open(os.path.join(target_dir, "landslide_comparison.json"), "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)
        with open(os.path.join(target_dir, "landslide_thresholds.json"), "w") as f:
            json.dump(thresholds, f, indent=2)

    print(f"\n[OK] Models, features, comparison report, and thresholds saved.")
    return report


if __name__ == "__main__":
    train_and_compare()
