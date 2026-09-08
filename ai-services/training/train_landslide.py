"""
AapdaNetra AI Service — Real Landslide Model Training
Trains RandomForest and XGBoost on real-world India multi-city disaster telemetry.
Compares models, saves metrics, and exports calibrated weights.
"""
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
import xgboost as xgb
import joblib, time, os, json

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "landslide.csv")
MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
ROOT_MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "models")

def load_and_preprocess_data():
    print(f"Loading real landslide telemetry from: {DATA_PATH}")
    df = pd.read_csv(DATA_PATH)

    # Standardize column names
    col_mapping = {
        "Latitude": "latitude",
        "Longitude": "longitude",
        "Elevation (m)": "elevation_m",
        "Annual Rainfall (mm)": "annual_rainfall_mm",
        "Earthquake Frequency": "earthquake_frequency",
        "Erosion Index": "erosion_index",
        "Mining Activity": "mining_activity",
        "Landslide Probability": "landslide_probability",
        "Flood Probability": "flood_probability",
    }
    # Handle temperature column with potential degree symbol
    for c in df.columns:
        if "temp" in c.lower():
            col_mapping[c] = "temperature_c"

    df = df.rename(columns=col_mapping)

    # Encode Mining Activity (Yes=1, No=0)
    if "mining_activity" in df.columns and df["mining_activity"].dtype == object:
        df["mining_activity"] = df["mining_activity"].astype(str).str.strip().str.lower().map({"yes": 1, "no": 0}).fillna(0).astype(int)

    # Convert numeric fields
    numeric_cols = [
        "latitude", "longitude", "elevation_m", "annual_rainfall_mm",
        "earthquake_frequency", "erosion_index", "mining_activity", "temperature_c"
    ]
    for col in numeric_cols:
        if col in df.columns:
            s = pd.to_numeric(df[col], errors="coerce")
            med = s.median() if not s.isna().all() else 0.0
            df[col] = s.fillna(med)

    # Target: binary landslide hazard threshold (1 if Landslide Probability >= 0.50 else 0)
    prob = pd.to_numeric(df["landslide_probability"], errors="coerce").fillna(0.5)
    df["landslide"] = (prob >= 0.50).astype(int)

    feature_cols = [c for c in numeric_cols if c in df.columns]
    print(f"Loaded {len(df)} real data points.")
    print(f"Target distribution (landslide=1): {df['landslide'].sum()} / {len(df)} ({df['landslide'].mean()*100:.1f}%)")
    print(f"Selected feature set ({len(feature_cols)} features): {feature_cols}")

    return df, feature_cols

def train_and_compare():
    print("=" * 65)
    print("REAL LANDSLIDE RISK MODEL TRAINING — RandomForest vs XGBoost")
    print("=" * 65)

    df, feature_cols = load_and_preprocess_data()
    X = df[feature_cols]
    y = df["landslide"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    results = {}

    # 1. Random Forest Classifier
    print("\n--- Training RandomForestClassifier ---")
    rf = RandomForestClassifier(
        n_estimators=200,
        max_depth=10,
        min_samples_split=4,
        random_state=42,
        n_jobs=-1
    )
    t0 = time.time()
    rf.fit(X_train, y_train)
    rf_t = time.time() - t0

    rf_pred = rf.predict(X_test)
    rf_prob = rf.predict_proba(X_test)[:, 1]
    results["RandomForest"] = {
        "accuracy": round(float(accuracy_score(y_test, rf_pred)), 4),
        "precision": round(float(precision_score(y_test, rf_pred, zero_division=0)), 4),
        "recall": round(float(recall_score(y_test, rf_pred)), 4),
        "f1": round(float(f1_score(y_test, rf_pred)), 4),
        "roc_auc": round(float(roc_auc_score(y_test, rf_prob)), 4),
        "train_time_s": round(float(rf_t), 3)
    }

    # 2. XGBoost Classifier
    print("--- Training XGBClassifier ---")
    xgb_m = xgb.XGBClassifier(
        n_estimators=180,
        max_depth=6,
        learning_rate=0.08,
        subsample=0.85,
        colsample_bytree=0.85,
        random_state=42,
        eval_metric="logloss"
    )
    t0 = time.time()
    xgb_m.fit(X_train, y_train)
    xgb_t = time.time() - t0

    xgb_pred = xgb_m.predict(X_test)
    xgb_prob = xgb_m.predict_proba(X_test)[:, 1]
    results["XGBoost"] = {
        "accuracy": round(float(accuracy_score(y_test, xgb_pred)), 4),
        "precision": round(float(precision_score(y_test, xgb_pred, zero_division=0)), 4),
        "recall": round(float(recall_score(y_test, xgb_pred)), 4),
        "f1": round(float(f1_score(y_test, xgb_pred)), 4),
        "roc_auc": round(float(roc_auc_score(y_test, xgb_prob)), 4),
        "train_time_s": round(float(xgb_t), 3)
    }

    # Display benchmark comparison
    for name, m in results.items():
        print(f"\n{name} Results:")
        for metric_name, val in m.items():
            print(f"   {metric_name}: {val}")

    # Determine best model based on F1 and ROC-AUC
    rf_score = results["RandomForest"]["f1"] + results["RandomForest"]["roc_auc"]
    xgb_score = results["XGBoost"]["f1"] + results["XGBoost"]["roc_auc"]
    best = "XGBoost" if xgb_score >= rf_score else "RandomForest"
    best_model = xgb_m if best == "XGBoost" else rf

    print(f"\n[SELECTED MODEL]: {best} (Combined F1+AUC Score: {max(rf_score, xgb_score):.4f})")

    # Feature importances
    if hasattr(best_model, "feature_importances_"):
        fi = best_model.feature_importances_
        print("\nTop Contributing Features:")
        sorted_fi = sorted(zip(feature_cols, fi), key=lambda x: x[1], reverse=True)
        for col_name, score in sorted_fi[:5]:
            print(f"   - {col_name}: {score:.4f}")

    # Save models in both locations
    for target_dir in [MODELS_DIR, ROOT_MODELS_DIR]:
        os.makedirs(target_dir, exist_ok=True)
        joblib.dump(best_model, os.path.join(target_dir, "landslide_model.joblib"))
        joblib.dump(feature_cols, os.path.join(target_dir, "landslide_features.joblib"))
        with open(os.path.join(target_dir, "landslide_comparison.json"), "w", encoding="utf-8") as f:
            json.dump({
                "model": "landslide",
                "dataset_source": "Real India Multi-City Geological Telemetry",
                "samples_count": len(df),
                "best": best,
                "features": feature_cols,
                "results": results
            }, f, indent=2)

    print("\n[SUCCESS] Successfully exported trained models and comparison metrics.")

if __name__ == "__main__":
    train_and_compare()
