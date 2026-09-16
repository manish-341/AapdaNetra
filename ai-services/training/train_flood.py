"""
AapdaNetra AI Service — Flood Model Training (v3 — Real Government Data Only)
Trains RandomForest and XGBoost on real IMD/CWC hydrological data.
Sources:
  - flood_training_dataset.csv  (15,000 samples — IMD Pune, CWC, Copernicus DEM, Sentinel-2)
  - flood_realtime.csv          (5,000 samples — CWC telemetry with lat/lon)
  - india_hazard_master_training_dataset.csv  (additional flood-labeled sites)
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
import warnings


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "..", "data")
MODELS_DIR = os.path.join(BASE_DIR, "..", "models")
ROOT_MODELS_DIR = os.path.join(BASE_DIR, "..", "..", "models")

# ── Real government-sourced datasets only ────────────────────────────────────
PRIMARY_DATA   = os.path.join(DATA_DIR, "flood_training_dataset.csv")
REALTIME_DATA  = os.path.join(DATA_DIR, "flood_realtime.csv")
MASTER_DATA    = os.path.join(DATA_DIR, "india_hazard_master_training_dataset.csv")

# Feature columns aligned with the real government dataset schema
FEATURE_COLS = [
    "elevation_m", "slope_deg", "curvature",
    "annual_rainfall_mm", "monsoon_rainfall_mm", "max_daily_rainfall_mm",
    "rainfall_flash_ratio", "dist_to_river_km", "river_density_km_sqkm",
    "dist_to_road_km", "topographic_wetness_index", "ndvi",
]

# LULC one-hot columns present in the training dataset
LULC_COLS = [
    "lulc_Agricultural", "lulc_Barren", "lulc_Barren_Rocky", "lulc_Barren_Sandy",
    "lulc_Dense_Forest", "lulc_Grassland", "lulc_Open_Forest", "lulc_Plantation",
    "lulc_Scrubland", "lulc_Settlement", "lulc_Water_Body", "lulc_Wetland",
]

TARGET_COL = "flood_label"


def load_and_merge_data():
    """Load and merge all real government-sourced flood datasets."""
    frames = []

    # 1. Primary training dataset (IMD/CWC/Copernicus)
    if os.path.exists(PRIMARY_DATA):
        df_primary = pd.read_csv(PRIMARY_DATA)
        print(f"  [+] flood_training_dataset.csv : {len(df_primary):,} rows")
        frames.append(df_primary)
    else:
        raise FileNotFoundError(f"Primary training data not found: {PRIMARY_DATA}")

    # 2. Master multi-hazard dataset — extract flood-relevant columns
    if os.path.exists(MASTER_DATA):
        df_master = pd.read_csv(MASTER_DATA)
        # The master dataset uses the same column naming — select flood columns
        master_cols_available = [c for c in FEATURE_COLS + LULC_COLS if c in df_master.columns]
        if TARGET_COL in df_master.columns and len(master_cols_available) > 5:
            keep_cols = master_cols_available + [TARGET_COL]
            if "state" in df_master.columns:
                keep_cols.append("state")
            if "district" in df_master.columns:
                keep_cols.append("district")
            df_master_flood = df_master[keep_cols].copy()
            print(f"  [+] india_hazard_master (flood) : {len(df_master_flood):,} rows")
            frames.append(df_master_flood)

    # 3. CWC real-time telemetry — different schema, map columns
    if os.path.exists(REALTIME_DATA):
        df_rt = pd.read_csv(REALTIME_DATA)
        col_map = {}
        for c in df_rt.columns:
            cl = c.lower().strip()
            if "rainfall" in cl and "mm" in cl:
                col_map[c] = "annual_rainfall_mm"
            elif "elevation" in cl:
                col_map[c] = "elevation_m"
            elif "water level" in cl:
                col_map[c] = "topographic_wetness_index"  # proxy
            elif "humidity" in cl:
                col_map[c] = "ndvi"  # humidity as proxy for vegetation health
            elif "river discharge" in cl:
                col_map[c] = "river_density_km_sqkm"  # proxy
            elif "flood occurred" in cl or "flood" == cl:
                col_map[c] = TARGET_COL
        if col_map:
            df_rt = df_rt.rename(columns=col_map)
        if TARGET_COL in df_rt.columns:
            print(f"  [+] flood_realtime.csv (CWC)   : {len(df_rt):,} rows (partial schema)")
            frames.append(df_rt)

    # Merge
    df = pd.concat(frames, ignore_index=True, sort=False)
    print(f"\n  Total merged rows: {len(df):,}")
    return df


def prepare_features(df):
    """Prepare the feature matrix, handling missing LULC columns gracefully."""
    all_features = FEATURE_COLS + LULC_COLS
    available = [c for c in all_features if c in df.columns]

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

    # Fill missing feature columns with 0
    for c in all_features:
        if c not in df.columns:
            df[c] = 0.0

    # Fill NaN in feature columns with column median
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
    print("  AAPDANETRA FLOOD MODEL v3 — REAL GOVERNMENT DATA TRAINING")
    print("  Sources: IMD Pune, CWC Telemetry, Copernicus DEM, Sentinel-2")
    print("=" * 70)

    # ── Load data ────────────────────────────────────────────────────────
    df = load_and_merge_data()
    feature_cols = prepare_features(df)

    # Ensure target exists and is binary
    if TARGET_COL not in df.columns:
        # Fallback: check for 'flood' column
        if "flood" in df.columns:
            df[TARGET_COL] = df["flood"].astype(int)
        else:
            raise ValueError(f"Target column '{TARGET_COL}' not found in data")

    df[TARGET_COL] = pd.to_numeric(df[TARGET_COL], errors="coerce").fillna(0).astype(int)

    X = df[feature_cols].values
    y = df[TARGET_COL].values

    print(f"\n  Features ({len(feature_cols)}): {feature_cols[:8]}... + {len(LULC_COLS)} LULC")
    print(f"  Target distribution: {y.sum():,} flood / {(1-y).sum():,.0f} no-flood "
          f"({y.mean()*100:.1f}% positive)")

    # ── Spatial-aware split (use district as group if available) ──────────
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
    rf_train_time = time.time() - t0

    t0 = time.time()
    rf_pred = rf.predict(X_test)
    rf_prob = rf.predict_proba(X_test)[:, 1]
    rf_infer = (time.time() - t0) / len(X_test) * 1000

    results["RandomForest"] = {
        "accuracy": round(accuracy_score(y_test, rf_pred), 4),
        "precision": round(precision_score(y_test, rf_pred, zero_division=0), 4),
        "recall": round(recall_score(y_test, rf_pred, zero_division=0), 4),
        "f1": round(f1_score(y_test, rf_pred, zero_division=0), 4),
        "roc_auc": round(roc_auc_score(y_test, rf_prob), 4),
        "train_time_s": round(rf_train_time, 3),
        "inference_ms_per_sample": round(rf_infer, 4),
    }

    # ── 2. XGBoost ───────────────────────────────────────────────────────
    print("--- [2] Training XGBoost Classifier ---")
    xgb_model = xgb.XGBClassifier(
        n_estimators=300, max_depth=7, learning_rate=0.06,
        subsample=0.85, colsample_bytree=0.8, reg_alpha=0.1, reg_lambda=1.0,
        random_state=42, eval_metric="logloss", verbosity=0
    )
    t0 = time.time()
    xgb_model.fit(X_train, y_train)
    xgb_train_time = time.time() - t0

    t0 = time.time()
    xgb_pred = xgb_model.predict(X_test)
    xgb_prob = xgb_model.predict_proba(X_test)[:, 1]
    xgb_infer = (time.time() - t0) / len(X_test) * 1000

    results["XGBoost"] = {
        "accuracy": round(accuracy_score(y_test, xgb_pred), 4),
        "precision": round(precision_score(y_test, xgb_pred, zero_division=0), 4),
        "recall": round(recall_score(y_test, xgb_pred, zero_division=0), 4),
        "f1": round(f1_score(y_test, xgb_pred, zero_division=0), 4),
        "roc_auc": round(roc_auc_score(y_test, xgb_prob), 4),
        "train_time_s": round(xgb_train_time, 3),
        "inference_ms_per_sample": round(xgb_infer, 4),
    }

    # ── 3. Select best model ─────────────────────────────────────────────
    print("\n" + "=" * 70)
    print(f" {'Metric':<25} {'RandomForest':<20} {'XGBoost':<20}")
    print(" " + "-" * 65)
    for metric in ["accuracy", "precision", "recall", "f1", "roc_auc", "train_time_s"]:
        print(f" {metric:<25} {str(results['RandomForest'][metric]):<20} {str(results['XGBoost'][metric]):<20}")

    rf_score = results["RandomForest"]["f1"] + results["RandomForest"]["roc_auc"]
    xgb_score = results["XGBoost"]["f1"] + results["XGBoost"]["roc_auc"]
    best_name = "XGBoost" if xgb_score >= rf_score else "RandomForest"
    best_model = xgb_model if best_name == "XGBoost" else rf
    print(f"\n>>> BEST MODEL: {best_name} (F1+AUC = {max(rf_score, xgb_score):.4f})")

    # ── 4. Calibrate probabilities ───────────────────────────────────────
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

    # ── 5. Compute training-data percentile thresholds ───────────────────
    thresholds = compute_thresholds(df, feature_cols)

    # ── 6. Feature importances ───────────────────────────────────────────
    if hasattr(best_model, "feature_importances_"):
        fi = best_model.feature_importances_
        print("\n  Top 8 Decision Drivers:")
        sorted_fi = sorted(zip(feature_cols, fi), key=lambda x: x[1], reverse=True)
        for col_name, score in sorted_fi[:8]:
            bar = "#" * int(score * 40)
            print(f"    {col_name:<30} {score*100:5.1f}%  {bar}")

    # ── 7. Save artifacts ────────────────────────────────────────────────
    report = {
        "model": "flood",
        "version": "v3.0",
        "dataset_source": "IMD Pune 0.25° Gridded Rainfall, CWC River Telemetry, Copernicus DEM GLO-30, Sentinel-2 NDVI",
        "datasets_used": [
            "flood_training_dataset.csv",
            "flood_realtime.csv (CWC)",
            "india_hazard_master_training_dataset.csv (flood subset)",
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

        # Save calibrated model as the default
        joblib.dump(calibrated, os.path.join(target_dir, "flood_model.joblib"))
        joblib.dump(rf, os.path.join(target_dir, "flood_rf.joblib"))
        joblib.dump(xgb_model, os.path.join(target_dir, "flood_xgb.joblib"))
        joblib.dump(feature_cols, os.path.join(target_dir, "flood_features.joblib"))

        with open(os.path.join(target_dir, "flood_comparison.json"), "w") as f:
            json.dump(report, f, indent=2)

        with open(os.path.join(target_dir, "flood_thresholds.json"), "w") as f:
            json.dump(thresholds, f, indent=2)

    print(f"\n[OK] Models, features, comparison report, and thresholds saved to:")
    print(f"     - {MODELS_DIR}")
    print(f"     - {ROOT_MODELS_DIR}")
    return report


if __name__ == "__main__":
    train_and_compare()
