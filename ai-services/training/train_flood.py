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

def generate_flood_data(n=5000):
    """Generate realistic synthetic flood training data"""
    np.random.seed(42)
    data = {
        "rainfall_mm": np.random.exponential(25, n) + np.random.uniform(0, 50, n),
        
        "water_level_m": np.random.uniform(0, 15, n),
        "humidity_pct": np.random.uniform(30, 100, n),
        "soil_moisture_pct": np.random.uniform(10, 95, n),
        "elevation_m": np.random.uniform(5, 500, n),
        "river_distance_km": np.random.exponential(5, n),
        "drainage_capacity": np.random.uniform(0.1, 1.0, n),
        "urbanization_pct": np.random.uniform(10, 95, n),
        "slope_deg": np.random.uniform(0, 30, n),
        "historical_floods": np.random.randint(0, 10, n),
        "temperature_c": np.random.uniform(15, 45, n),
        "wind_speed_ms": np.random.uniform(0, 25, n),
    }
    df = pd.DataFrame(data)

    # Generate target: flood probability based on realistic factors
    flood_score = (
        (df["rainfall_mm"] / 100) * 0.30 +
        (df["water_level_m"] / 15) * 0.20 +
        (df["humidity_pct"] / 100) * 0.10 +
        (df["soil_moisture_pct"] / 100) * 0.10 +
        (1 - df["elevation_m"] / 500) * 0.08 +
        (1 - df["river_distance_km"] / 20).clip(0, 1) * 0.08 +
        (1 - df["drainage_capacity"]) * 0.06 +
        (df["urbanization_pct"] / 100) * 0.04 +
        (df["historical_floods"] / 10) * 0.04
    )
    noise = np.random.normal(0, 0.08, n)
    df["flood"] = ((flood_score + noise) > 0.45).astype(int)

    return df

def train_and_compare():
    print("=" * 60)
    print("FLOOD MODEL TRAINING — RandomForest vs XGBoost")
    print("=" * 60)

    df = generate_flood_data(5000)
    feature_cols = [c for c in df.columns if c != "flood"]
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
    rf_infer_time = (time.time() - t0) / len(X_test) * 1000  # ms per sample

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
    os.makedirs("../models", exist_ok=True)
    joblib.dump(best_model, "../models/flood_model.joblib")
    joblib.dump(rf, "../models/flood_rf.joblib")
    joblib.dump(xgb_model, "../models/flood_xgb.joblib")
    joblib.dump(feature_cols, "../models/flood_features.joblib")

    # Save comparison report
    report = {
        "model": "flood",
        "best": best_name,
        "features": feature_cols,
        "results": results,
        "data_size": len(df),
        "positive_ratio": round(y.mean(), 4)
    }
    with open("../models/flood_comparison.json", "w") as f:
        json.dump(report, f, indent=2)

    print(f"\nModels saved to ../models/")
    return report

if __name__ == "__main__":
    train_and_compare()
