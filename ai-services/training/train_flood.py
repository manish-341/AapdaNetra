"""
AapdaNetra AI Service — Flood Model Training
Trains RandomForest and XGBoost, compares metrics, saves the best model.
"""
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
import xgboost as xgb
import joblib
import time
import os
import json

def load_and_preprocess_data():
    data_path = os.path.join(os.path.dirname(__file__), "..", "data", "landslide.csv")
    print(f"Loading real flood telemetry from: {data_path}")
    df = pd.read_csv(data_path)

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
    for c in df.columns:
        if "temp" in c.lower():
            col_mapping[c] = "temperature_c"

    df = df.rename(columns=col_mapping)

    if "mining_activity" in df.columns and df["mining_activity"].dtype == object:
        df["mining_activity"] = df["mining_activity"].astype(str).str.strip().str.lower().map({"yes": 1, "no": 0}).fillna(0).astype(int)

    numeric_cols = [
        "latitude", "longitude", "elevation_m", "annual_rainfall_mm",
        "earthquake_frequency", "erosion_index", "mining_activity", "temperature_c"
    ]
    
    for col in numeric_cols:
        if col in df.columns:
            s = pd.to_numeric(df[col], errors="coerce")
            med = s.median() if not s.isna().all() else 0.0
            df[col] = s.fillna(med)

    # Target: binary flood hazard threshold
    prob = pd.to_numeric(df["flood_probability"], errors="coerce").fillna(0.5)
    df["flood"] = (prob >= 0.50).astype(int)

    feature_cols = [c for c in numeric_cols if c in df.columns]
    
    return df, feature_cols

def train_and_compare():
    print("=" * 60)
    print("FLOOD MODEL TRAINING — RandomForest vs XGBoost (Real Data)")
    print("=" * 60)

    df, feature_cols = load_and_preprocess_data()
    X = df[feature_cols]
    y = df["flood"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    results = {}

    # RandomForest
    print("\n--- Training RandomForest ---")
    rf = RandomForestClassifier(n_estimators=200, max_depth=12, random_state=42, n_jobs=-1)
    t0 = time.time()
    rf.fit(X_train, y_train)
    rf_train_time = time.time() - t0

    t0 = time.time()
    rf_pred = rf.predict(X_test)
    rf_prob = rf.predict_proba(X_test)[:, 1]
    rf_infer_time = (time.time() - t0) / len(X_test) * 1000

    results["RandomForest"] = {
        "accuracy": round(accuracy_score(y_test, rf_pred), 4),
        "precision": round(precision_score(y_test, rf_pred), 4),
        "recall": round(recall_score(y_test, rf_pred), 4),
        "f1": round(f1_score(y_test, rf_pred), 4),
        "roc_auc": round(roc_auc_score(y_test, rf_prob), 4),
        "train_time_s": round(rf_train_time, 3),
        "inference_ms_per_sample": round(rf_infer_time, 4)
    }

    # XGBoost
    print("--- Training XGBoost ---")
    xgb_model = xgb.XGBClassifier(
        n_estimators=200, max_depth=8, learning_rate=0.1,
        subsample=0.8, colsample_bytree=0.8, random_state=42,
        eval_metric="logloss"
    )
    t0 = time.time()
    xgb_model.fit(X_train, y_train)
    xgb_train_time = time.time() - t0

    t0 = time.time()
    xgb_pred = xgb_model.predict(X_test)
    xgb_prob = xgb_model.predict_proba(X_test)[:, 1]
    xgb_infer_time = (time.time() - t0) / len(X_test) * 1000

    results["XGBoost"] = {
        "accuracy": round(accuracy_score(y_test, xgb_pred), 4),
        "precision": round(precision_score(y_test, xgb_pred), 4),
        "recall": round(recall_score(y_test, xgb_pred), 4),
        "f1": round(f1_score(y_test, xgb_pred), 4),
        "roc_auc": round(roc_auc_score(y_test, xgb_prob), 4),
        "train_time_s": round(xgb_train_time, 3),
        "inference_ms_per_sample": round(xgb_infer_time, 4)
    }

    # Compare and select best
    print("\n--- COMPARISON ---")
    for name, metrics in results.items():
        print(f"\n{name}:")
        for k, v in metrics.items():
            print(f"  {k}: {v}")

    rf_f1 = results["RandomForest"]["f1"]
    xgb_f1 = results["XGBoost"]["f1"]

    best_name = "XGBoost" if xgb_f1 > rf_f1 else "RandomForest"
    best_model = xgb_model if best_name == "XGBoost" else rf
    print(f"\n[BEST MODEL] Best model: {best_name} (F1: {results[best_name]['f1']})")

    # Save models
    models_dir = os.path.join(os.path.dirname(__file__), "..", "models")
    root_models_dir = os.path.join(os.path.dirname(__file__), "..", "..", "models")
    
    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(root_models_dir, exist_ok=True)
    
    joblib.dump(best_model, os.path.join(models_dir, "flood_model.joblib"))
    joblib.dump(best_model, os.path.join(root_models_dir, "flood_model.joblib"))
    
    joblib.dump(feature_cols, os.path.join(models_dir, "flood_features.joblib"))
    joblib.dump(feature_cols, os.path.join(root_models_dir, "flood_features.joblib"))

    # Save comparison report
    report = {
        "model": "flood",
        "dataset_source": "Real India Multi-City Geological Telemetry",
        "samples_count": len(df),
        "best": best_name,
        "features": feature_cols,
        "results": results,
        "positive_ratio": round(y.mean(), 4)
    }
    
    with open(os.path.join(models_dir, "flood_comparison.json"), "w") as f:
        json.dump(report, f, indent=2)
        
    with open(os.path.join(root_models_dir, "flood_comparison.json"), "w") as f:
        json.dump(report, f, indent=2)

    print(f"\nModels saved to models directories.")
    return report

if __name__ == "__main__":
    train_and_compare()
