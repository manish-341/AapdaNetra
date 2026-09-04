"""
AapdaNetra AI Service — Landslide Model Training
"""
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
import xgboost as xgb
import joblib, time, os, json

def generate_landslide_data(n=5000):
    np.random.seed(43)
    data = {
        "slope_angle_deg": np.random.uniform(5, 70, n),
        "rainfall_mm": np.random.exponential(30, n) + np.random.uniform(0, 40, n),
        "soil_moisture_pct": np.random.uniform(15, 98, n),
        "elevation_m": np.random.uniform(50, 3000, n),
        "vegetation_cover_pct": np.random.uniform(0, 90, n),
        "seismic_activity": np.random.uniform(0, 5, n),
        "drainage_proximity_km": np.random.exponential(2, n),
        "soil_type_score": np.random.uniform(0, 1, n),  # 0=stable rock, 1=loose soil
        "land_use_score": np.random.uniform(0, 1, n),  # 0=undisturbed, 1=heavily modified
        "rainfall_duration_h": np.random.exponential(6, n),
        "previous_slides": np.random.randint(0, 5, n),
    }
    df = pd.DataFrame(data)

    score = (
        (df["slope_angle_deg"] / 70) * 0.25 +
        (df["rainfall_mm"] / 120) * 0.20 +
        (df["soil_moisture_pct"] / 100) * 0.12 +
        (df["soil_type_score"]) * 0.10 +
        (1 - df["vegetation_cover_pct"] / 90) * 0.08 +
        (df["seismic_activity"] / 5) * 0.08 +
        (1 - df["drainage_proximity_km"] / 10).clip(0, 1) * 0.05 +
        (df["land_use_score"]) * 0.05 +
        (df["rainfall_duration_h"] / 30).clip(0, 1) * 0.04 +
        (df["previous_slides"] / 5) * 0.03
    )
    df["landslide"] = ((score + np.random.normal(0, 0.08, n)) > 0.45).astype(int)
    return df

def train_and_compare():
    print("=" * 60)
    print("LANDSLIDE MODEL TRAINING — RandomForest vs XGBoost")
    print("=" * 60)

    df = generate_landslide_data(5000)
    feature_cols = [c for c in df.columns if c != "landslide"]
    X, y = df[feature_cols], df["landslide"]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    results = {}
    # RandomForest
    rf = RandomForestClassifier(n_estimators=200, max_depth=12, random_state=42, n_jobs=-1)
    t0 = time.time(); rf.fit(X_train, y_train); rf_t = time.time() - t0
    rf_pred = rf.predict(X_test); rf_prob = rf.predict_proba(X_test)[:, 1]
    results["RandomForest"] = {"accuracy": round(accuracy_score(y_test, rf_pred), 4), "precision": round(precision_score(y_test, rf_pred), 4), "recall": round(recall_score(y_test, rf_pred), 4), "f1": round(f1_score(y_test, rf_pred), 4), "roc_auc": round(roc_auc_score(y_test, rf_prob), 4), "train_time_s": round(rf_t, 3)}

    # XGBoost
    xgb_m = xgb.XGBClassifier(n_estimators=200, max_depth=8, learning_rate=0.1, subsample=0.8, colsample_bytree=0.8, random_state=42, eval_metric="logloss")
    t0 = time.time(); xgb_m.fit(X_train, y_train); xgb_t = time.time() - t0
    xgb_pred = xgb_m.predict(X_test); xgb_prob = xgb_m.predict_proba(X_test)[:, 1]
    results["XGBoost"] = {"accuracy": round(accuracy_score(y_test, xgb_pred), 4), "precision": round(precision_score(y_test, xgb_pred), 4), "recall": round(recall_score(y_test, xgb_pred), 4), "f1": round(f1_score(y_test, xgb_pred), 4), "roc_auc": round(roc_auc_score(y_test, xgb_prob), 4), "train_time_s": round(xgb_t, 3)}

    for name, m in results.items():
        print(f"\n{name}: " + " | ".join(f"{k}={v}" for k, v in m.items()))

    best = "XGBoost" if results["XGBoost"]["f1"] > results["RandomForest"]["f1"] else "RandomForest"
    print(f"\n[BEST MODEL] Best: {best}")

    os.makedirs("../models", exist_ok=True)
    joblib.dump(xgb_m if best == "XGBoost" else rf, "../models/landslide_model.joblib")
    joblib.dump(feature_cols, "../models/landslide_features.joblib")
    with open("../models/landslide_comparison.json", "w") as f:
        json.dump({"model": "landslide", "best": best, "features": feature_cols, "results": results}, f, indent=2)

if __name__ == "__main__":
    train_and_compare()
