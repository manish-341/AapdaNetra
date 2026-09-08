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

    def _get_val(self, data: dict, *keys, default=0.0):
        for k in keys:
            v = data.get(k)
            if v is not None:
                return v
        return default

    def predict_hazard(self, hazard_type: str, data: dict) -> dict:
        hazard = hazard_type.lower()

        if hazard in self.models and hazard in self.features:
            model = self.models[hazard]
            feature_cols = self.features[hazard]

            # Build feature vector with defaults if missing or None
            row = {}
            for col in feature_cols:
                raw_val = data.get(col)
                if raw_val is None:
                    raw_val = self._get_default_val(col, data)
                if col == "mining_activity":
                    row[col] = 1.0 if str(raw_val).strip().lower() in ["yes", "1", "true", "y"] else 0.0
                else:
                    try:
                        row[col] = float(raw_val)
                    except (ValueError, TypeError):
                        def_val = self._get_default_val(col, data)
                        row[col] = float(def_val) if def_val is not None else 0.0

            df_input = pd.DataFrame([row])
            prob = float(model.predict_proba(df_input)[0, 1])

            # Get feature importance explanation
            importance = {}
            if hasattr(model, "feature_importances_"):
                fi = model.feature_importances_
                top_idx = np.argsort(fi)[::-1][:3]
                for idx in top_idx:
                    importance[feature_cols[idx]] = round(float(fi[idx]), 3)

            best_model_name = self.comparisons.get(hazard, {}).get("best", "RandomForest" if hazard == "landslide" else "XGBoost")

            return {
                "hazard_type": hazard.upper(),
                "probability": round(prob, 4),
                "risk_score": int(prob * 100),
                "confidence": 0.88 if hazard in self.comparisons else 0.75,
                "model_used": best_model_name,
                "top_factors": importance
            }
        else:
            # Fallback calculation
            return self._fallback_prediction(hazard, data)

    def _get_default_val(self, col, data):
        rain_base = float(self._get_val(data, "rainfall", "rainfall_mm", default=20.0) or 20.0)
        defaults = {
            "latitude": self._get_val(data, "latitude", "lat", default=20.5937),
            "longitude": self._get_val(data, "longitude", "lon", "lng", default=78.9629),
            "elevation_m": self._get_val(data, "elevation_m", "elevation", default=500.0),
            "annual_rainfall_mm": self._get_val(data, "annual_rainfall_mm", "rainfall_annual", default=rain_base * 35.0),
            "earthquake_frequency": self._get_val(data, "earthquake_frequency", "seismic_activity", default=2.5),
            "erosion_index": self._get_val(data, "erosion_index", "soil_type_score", default=5.0),
            "mining_activity": 1.0 if str(self._get_val(data, "mining_activity", default="No")).strip().lower() in ["yes", "1", "true", "y"] else 0.0,
            "rainfall_mm": self._get_val(data, "rainfall_mm", "rainfall", default=20.0),
            "water_level_m": 5.0,
            "humidity_pct": self._get_val(data, "humidity_pct", "humidity", default=65.0),
            "soil_moisture_pct": self._get_val(data, "soil_moisture_pct", default=50.0),
            "river_distance_km": 3.0,
            "drainage_capacity": 0.5,
            "urbanization_pct": 50.0,
            "slope_deg": self._get_val(data, "slope_deg", "slope_angle_deg", default=15.0),
            "historical_floods": 2,
            "temperature_c": self._get_val(data, "temperature_c", "temperature", default=28.0),
            "wind_speed_ms": self._get_val(data, "wind_speed_ms", "wind_speed", default=10.0),
            "slope_angle_deg": self._get_val(data, "slope_angle_deg", default=25.0),
            "seismic_activity": 1.0,
            "drainage_proximity_km": 2.0,
            "soil_type_score": 0.5,
            "land_use_score": 0.5,
            "rainfall_duration_h": 4.0,
            "previous_slides": 1,
            "vegetation_cover_pct": 40.0,
            "vegetation_density": 0.5,
            "drought_index": 50.0,
            "precipitation_mm": rain_base,
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

    def get_comparison_metrics(self) -> dict:
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
