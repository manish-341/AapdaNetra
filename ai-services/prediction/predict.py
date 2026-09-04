"""
AapdaNetra Prediction Module
Provides unified risk predictions using trained models with fallback heuristics.
"""
import os
import json
import joblib
import numpy as np
import pandas as pd

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models")

class RiskPredictor:
    def __init__(self):
        self.models = {}
        self.features = {}
        self.comparisons = {}
        self._load_models()

    def _load_models(self):
        for hazard in ["flood", "landslide", "wildfire"]:
            model_path = os.path.join(MODEL_DIR, f"{hazard}_model.joblib")
            feature_path = os.path.join(MODEL_DIR, f"{hazard}_features.joblib")
            comp_path = os.path.join(MODEL_DIR, f"{hazard}_comparison.json")

            if os.path.exists(model_path):
                try:
                    self.models[hazard] = joblib.load(model_path)
                except Exception as e:
                    print(f"Failed to load {hazard} model: {e}")

            if os.path.exists(feature_path):
                try:
                    self.features[hazard] = joblib.load(feature_path)
                except Exception as e:
                    print(f"Failed to load {hazard} features: {e}")

            if os.path.exists(comp_path):
                try:
                    with open(comp_path, "r") as f:
                        self.comparisons[hazard] = json.load(f)
                except Exception:
                    pass

    def predict_hazard(self, hazard_type: str, data: dict) -> dict:
        hazard = hazard_type.lower()

        if hazard in self.models and hazard in self.features:
            model = self.models[hazard]
            feature_cols = self.features[hazard]

            # Build feature vector with defaults if missing
            row = {}
            for col in feature_cols:
                row[col] = data.get(col, self._get_default_val(col, data))

            df_input = pd.DataFrame([row])
            prob = float(model.predict_proba(df_input)[0, 1])

            # Get feature importance explanation
            importance = {}
            if hasattr(model, "feature_importances_"):
                fi = model.feature_importances_
                top_idx = np.argsort(fi)[::-1][:3]
                for idx in top_idx:
                    importance[feature_cols[idx]] = round(float(fi[idx]), 3)

            return {
                "hazard_type": hazard.upper(),
                "probability": round(prob, 4),
                "risk_score": int(prob * 100),
                "confidence": 0.88 if hazard in self.comparisons else 0.75,
                "model_used": self.comparisons.get(hazard, {}).get("best", "XGBoost"),
                "top_factors": importance
            }
        else:
            # Fallback calculation
            return self._fallback_prediction(hazard, data)

    def _get_default_val(self, col, data):
        defaults = {
            "rainfall_mm": data.get("rainfall", 20.0),
            "water_level_m": 5.0,
            "humidity_pct": data.get("humidity", 65.0),
            "soil_moisture_pct": 50.0,
            "elevation_m": 150.0,
            "river_distance_km": 3.0,
            "drainage_capacity": 0.5,
            "urbanization_pct": 50.0,
            "slope_deg": 15.0,
            "historical_floods": 2,
            "temperature_c": data.get("temperature", 30.0),
            "wind_speed_ms": data.get("wind_speed", 10.0),
            "slope_angle_deg": 25.0,
            "seismic_activity": 1.0,
            "drainage_proximity_km": 2.0,
            "soil_type_score": 0.5,
            "land_use_score": 0.5,
            "rainfall_duration_h": 4.0,
            "previous_slides": 1,
            "vegetation_cover_pct": 40.0,
            "vegetation_density": 0.5,
            "drought_index": 50.0,
            "precipitation_mm": data.get("rainfall", 5.0),
            "human_activity_score": 0.5
        }
        return defaults.get(col, 0.0)

    def _fallback_prediction(self, hazard: str, data: dict) -> dict:
        rainfall = data.get("rainfall", 10)
        temp = data.get("temperature", 30)
        humidity = data.get("humidity", 60)

        if hazard == "flood":
            prob = min((rainfall / 100) * 0.7 + (humidity / 100) * 0.3, 0.99)
        elif hazard == "landslide":
            prob = min((rainfall / 80) * 0.6 + (humidity / 100) * 0.3, 0.99)
        elif hazard == "wildfire":
            prob = min((temp / 45) * 0.5 + ((100 - humidity) / 100) * 0.5, 0.99)
        else:
            prob = 0.2

        return {
            "hazard_type": hazard.upper(),
            "probability": round(prob, 4),
            "risk_score": int(prob * 100),
            "confidence": 0.60,
            "model_used": "Rule-Based Fallback",
            "top_factors": {"rainfall": rainfall, "temperature": temp, "humidity": humidity}
        }

    def predict_unified(self, data: dict) -> dict:
        result = {}
        for h in ["flood", "landslide", "wildfire"]:
            result[h] = self.predict_hazard(h, data)
        return result

    def get_comparison_metrics() -> dict:
        res = {}
        for h in ["flood", "landslide", "wildfire"]:
            comp_path = os.path.join(MODEL_DIR, f"{h}_comparison.json")
            if os.path.exists(comp_path):
                with open(comp_path, "r") as f:
                    res[h] = json.load(f)
            else:
                res[h] = {"status": "Not trained yet"}
        return res

predictor = RiskPredictor()
