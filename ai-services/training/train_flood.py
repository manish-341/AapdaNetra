"""
AapdaNetra AI Service — Flood Model Training
Trains RandomForest and XGBoost on real hydrological telemetry, compares metrics, and saves the best model.
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
    base_dir = os.path.dirname(os.path.abspath(__file__))
    primary_data_path = os.path.join(base_dir, "..", "data", "flood_data.csv")
    realtime_data_path = os.path.join(base_dir, "..", "data", "flood_realtime.csv")
    
    if os.path.exists(primary_data_path):
        print(f"Loading primary flood dataset: {primary_data_path}")
        df = pd.read_csv(primary_data_path)
        feature_cols = [c for c in df.columns if c != "flood"]
        return df, feature_cols
    elif os.path.exists(realtime_data_path):
        print(f"Loading real-time flood telemetry: {realtime_data_path}")
        df = pd.read_csv(realtime_data_path)
        col_mapping = {
            "Rainfall (mm)": "rainfall_mm",
            "Water Level (m)": "water_level_m",
            "Humidity (%)": "humidity_pct",
            "Elevation (m)": "elevation_m",
            "Historical Floods": "historical_floods",
            "Temperature (°C)": "temperature_c",
            "Flood Occurred": "flood"
        }
        df = df.rename(columns=col_mapping)
        feature_cols = [c for c in ["rainfall_mm", "water_level_m", "humidity_pct", "elevation_m", "historical_floods", "temperature_c"] if c in df.columns]
        return df, feature_cols
    else:
        raise FileNotFoundError(f"No flood dataset found at {primary_data_path} or {realtime_data_path}")

def train_and_compare():
    print("=" * 65)
    print(" AAPDANETRA FLOOD MODEL TRAINING & BENCHMARKING")
    print("=" * 65)

    df, feature_cols = load_and_preprocess_data()
    print(f"Dataset Shape: {df.shape[0]} rows, {len(feature_cols)} features")
    print(f"Features: {feature_cols}")

    X = df[feature_cols]
    y = df["flood"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    results = {}

    # 1. Train RandomForest
    print("\n--- [1] Training RandomForest Classifier ---")
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

    # 2. Train XGBoost
    print("--- [2] Training XGBoost Classifier ---")
    xgb_model = xgb.XGBClassifier(
        n_estimators=200, max_depth=6, learning_rate=0.08,
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

    # 3. Print Comparison
    print("\n" + "=" * 65)
    print(f" {'Metric':<15} {'RandomForest':<20} {'XGBoost':<20}")
    print(" " + "-" * 60)
    for metric in ["accuracy", "precision", "recall", "f1", "roc_auc", "train_time_s", "inference_ms_per_sample"]:
        rf_val = results["RandomForest"][metric]
        xgb_val = results["XGBoost"][metric]
        print(f" {metric:<15} {str(rf_val):<20} {str(xgb_val):<20}")

    rf_f1 = results["RandomForest"]["f1"]
    xgb_f1 = results["XGBoost"]["f1"]

    best_name = "XGBoost" if xgb_f1 > rf_f1 else "RandomForest"
    best_model = xgb_model if best_name == "XGBoost" else rf
    print(f"\n>>> BEST MODEL SELECTED: {best_name} (F1 Score: {results[best_name]['f1']}, ROC-AUC: {results[best_name]['roc_auc']})")

    # 4. Save artifacts
    models_dir = os.path.join(os.path.dirname(__file__), "..", "models")
    root_models_dir = os.path.join(os.path.dirname(__file__), "..", "..", "models")
    
    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(root_models_dir, exist_ok=True)
    
    for d in [models_dir, root_models_dir]:
        joblib.dump(best_model, os.path.join(d, "flood_model.joblib"))
        joblib.dump(rf, os.path.join(d, "flood_rf.joblib"))
        joblib.dump(xgb_model, os.path.join(d, "flood_xgb.joblib"))
        joblib.dump(feature_cols, os.path.join(d, "flood_features.joblib"))

    report = {
        "model": "flood",
        "dataset_source": "Hydrological Multi-Basin Telemetry (5,000 samples)",
        "samples_count": len(df),
        "best": best_name,
        "features": feature_cols,
        "results": results,
        "positive_ratio": round(float(y.mean()), 4)
    }
    
    for d in [models_dir, root_models_dir]:
        with open(os.path.join(d, "flood_comparison.json"), "w") as f:
            json.dump(report, f, indent=2)

    print(f"\n[OK] Model weights and benchmarks successfully saved to:")
    print(f"     - {models_dir}")
    print(f"     - {root_models_dir}")
    return report

if __name__ == "__main__":
    train_and_compare()
