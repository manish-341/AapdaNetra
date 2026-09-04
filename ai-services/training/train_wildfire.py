"""
AapdaNetra AI Service — Wildfire Model Training
"""
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
import xgboost as xgb
import joblib, time, os, json

def generate_wildfire_data(n=5000):
    np.random.seed(44)
    data = {
        "temperature_c": np.random.uniform(15, 50, n),
        "humidity_pct": np.random.uniform(5, 95, n),
        "wind_speed_ms": np.random.uniform(0, 30, n),
        "vegetation_density": np.random.uniform(0.1, 1.0, n),
        "drought_index": np.random.uniform(0, 100, n),
        "slope_deg": np.random.uniform(0, 45, n),
        "precipitation_mm": np.random.exponential(5, n),
        "human_activity_score": np.random.uniform(0, 1, n),
    }
    df = pd.DataFrame(data)

    score = (
        (df["temperature_c"] / 50) * 0.25 +
        ((100 - df["humidity_pct"]) / 100) * 0.25 +
        (df["wind_speed_ms"] / 30) * 0.20 +
        (df["vegetation_density"]) * 0.10 +
        (df["drought_index"] / 100) * 0.10 +
        (1 - (df["precipitation_mm"] / 20).clip(0, 1)) * 0.05 +
        (df["human_activity_score"]) * 0.05
    )
    df["wildfire"] = ((score + np.random.normal(0, 0.08, n)) > 0.45).astype(int)
    return df

def train_and_compare():
    print("=" * 60)
    print("WILDFIRE MODEL TRAINING — RandomForest vs XGBoost")
    print("=" * 60)

    df = generate_wildfire_data(5000)
    feature_cols = [c for c in df.columns if c != "wildfire"]
    X, y = df[feature_cols], df["wildfire"]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    results = {}
    rf = RandomForestClassifier(n_estimators=200, max_depth=12, random_state=42, n_jobs=-1)
    t0 = time.time(); rf.fit(X_train, y_train); rf_t = time.time() - t0
    rf_pred = rf.predict(X_test); rf_prob = rf.predict_proba(X_test)[:, 1]
    results["RandomForest"] = {"accuracy": round(accuracy_score(y_test, rf_pred), 4), "precision": round(precision_score(y_test, rf_pred), 4), "recall": round(recall_score(y_test, rf_pred), 4), "f1": round(f1_score(y_test, rf_pred), 4), "roc_auc": round(roc_auc_score(y_test, rf_prob), 4), "train_time_s": round(rf_t, 3)}

    xgb_m = xgb.XGBClassifier(n_estimators=200, max_depth=8, learning_rate=0.1, subsample=0.8, colsample_bytree=0.8, random_state=42, eval_metric="logloss")
    t0 = time.time(); xgb_m.fit(X_train, y_train); xgb_t = time.time() - t0
    xgb_pred = xgb_m.predict(X_test); xgb_prob = xgb_m.predict_proba(X_test)[:, 1]
    results["XGBoost"] = {"accuracy": round(accuracy_score(y_test, xgb_pred), 4), "precision": round(precision_score(y_test, xgb_pred), 4), "recall": round(recall_score(y_test, xgb_pred), 4), "f1": round(f1_score(y_test, xgb_pred), 4), "roc_auc": round(roc_auc_score(y_test, xgb_prob), 4), "train_time_s": round(xgb_t, 3)}

    for name, m in results.items():
        print(f"\n{name}: " + " | ".join(f"{k}={v}" for k, v in m.items()))

    best = "XGBoost" if results["XGBoost"]["f1"] > results["RandomForest"]["f1"] else "RandomForest"
    print(f"\n[BEST MODEL] Best: {best}")

    os.makedirs("../models", exist_ok=True)
    joblib.dump(xgb_m if best == "XGBoost" else rf, "../models/wildfire_model.joblib")
    joblib.dump(feature_cols, "../models/wildfire_features.joblib")
    with open("../models/wildfire_comparison.json", "w") as f:
        json.dump({"model": "wildfire", "best": best, "features": feature_cols, "results": results}, f, indent=2)

if __name__ == "__main__":
    train_and_compare()
