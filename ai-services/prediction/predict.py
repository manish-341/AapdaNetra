"""
AapdaNetra Prediction Module (v3 — Real Data + Live Weather Dynamic Adjustment)
Provides unified risk predictions using models trained on real government data
(IMD, CWC, GSI, NDMA) with optional real-time weather-based risk adjustment
via the threshold-exceedance system.
"""
import os
import json
import joblib
import numpy as np
import pandas as pd

from prediction.weather_risk_adjuster import weather_adjuster

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models")

# ── Feature-name mapping from API request fields to training feature names ──
# This allows the prediction endpoint to accept intuitive parameter names
# while mapping to the exact column names used during training.
API_TO_TRAINING_MAP = {
    # Flood features
    "rainfall": "max_daily_rainfall_mm",
    "rainfall_mm": "max_daily_rainfall_mm",
    "water_level_m": "topographic_wetness_index",
    "humidity": "ndvi",  # humidity correlates with vegetation health
    "humidity_pct": "ndvi",
    "river_distance_km": "dist_to_river_km",
    "soil_moisture_pct": "topographic_wetness_index",
    "historical_floods": "river_density_km_sqkm",

    # Landslide features
    "slope_angle_deg": "slope_deg",
    "earthquake_frequency": "slope_instability_index",
    "erosion_index": "curvature",
    "seismic_activity": "slope_instability_index",

    # Wildfire features
    "temperature": "mean_temperature_c",
    "temperature_c": "mean_temperature_c",
    "wind_speed": "fuel_aridity_index",
    "wind_speed_ms": "fuel_aridity_index",
    "drought_index": "fuel_aridity_index",
    "vegetation_density": "ndvi",
    "vegetation_cover_pct": "ndvi",
    "human_activity_score": "dist_to_road_km",

    # Direct matches (no mapping needed)
    "elevation_m": "elevation_m",
    "elevation": "elevation_m",
    "latitude": "latitude",
    "longitude": "longitude",
    "lat": "latitude",
    "lon": "longitude",
    "annual_rainfall_mm": "annual_rainfall_mm",
    "monsoon_rainfall_mm": "monsoon_rainfall_mm",
    "max_daily_rainfall_mm": "max_daily_rainfall_mm",
    "slope_deg": "slope_deg",
    "ndvi": "ndvi",
    "curvature": "curvature",
    "aspect_deg": "aspect_deg",
    "slope_instability_index": "slope_instability_index",
    "dist_to_road_km": "dist_to_road_km",
    "dist_to_river_km": "dist_to_river_km",
    "topographic_wetness_index": "topographic_wetness_index",
    "river_density_km_sqkm": "river_density_km_sqkm",
    "rainfall_flash_ratio": "rainfall_flash_ratio",
    "south_facing_aspect_index": "south_facing_aspect_index",
    "mean_temperature_c": "mean_temperature_c",
    "fuel_aridity_index": "fuel_aridity_index",
}

# Default values for features when not provided (median-range values from training data)
FEATURE_DEFAULTS = {
    "elevation_m": 300.0,
    "slope_deg": 8.0,
    "curvature": 0.15,
    "annual_rainfall_mm": 1200.0,
    "monsoon_rainfall_mm": 900.0,
    "max_daily_rainfall_mm": 80.0,
    "rainfall_flash_ratio": 0.15,
    "dist_to_river_km": 5.0,
    "river_density_km_sqkm": 1.2,
    "dist_to_road_km": 2.0,
    "topographic_wetness_index": 3.5,
    "ndvi": 0.45,
    "aspect_deg": 180.0,
    "slope_instability_index": 1.5,
    "south_facing_aspect_index": 0.0,
    "mean_temperature_c": 28.0,
    "fuel_aridity_index": 6.5,
}

# LULC columns — all default to 0 unless explicitly set
LULC_COLS = [
    "lulc_Agricultural", "lulc_Barren", "lulc_Barren_Rocky", "lulc_Barren_Sandy",
    "lulc_Dense_Forest", "lulc_Grassland", "lulc_Open_Forest", "lulc_Plantation",
    "lulc_Scrubland", "lulc_Settlement", "lulc_Water_Body", "lulc_Wetland",
]


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

    def _build_feature_vector(self, hazard: str, data: dict) -> pd.DataFrame:
        """
        Build the feature vector for prediction by mapping API fields
        to the training feature names.
        """
        feature_cols = self.features.get(hazard, [])
        row = {}

        for col in feature_cols:
            # 1. Direct match in data
            val = data.get(col)

            # 2. Try reverse-mapping from API names
            if val is None:
                for api_name, training_name in API_TO_TRAINING_MAP.items():
                    if training_name == col and api_name in data:
                        val = data[api_name]
                        break

            # 3. LULC columns default to 0
            if val is None and col in LULC_COLS:
                val = data.get(col, 0)

            # 4. Use feature default
            if val is None:
                val = FEATURE_DEFAULTS.get(col, 0.0)

            # Convert to float
            try:
                row[col] = float(val)
            except (ValueError, TypeError):
                row[col] = FEATURE_DEFAULTS.get(col, 0.0)

        return pd.DataFrame([row])

    def predict_hazard(self, hazard_type: str, data: dict, use_weather: bool = False) -> dict:
        """
        Predict hazard risk for a single hazard type.

        Args:
            hazard_type: "flood", "landslide", or "wildfire"
            data: dict with feature values (API field names or training field names)
            use_weather: if True, apply live weather dynamic risk adjustment

        Returns:
            dict with probability, risk_score, confidence, and optionally weather correlation
        """
        hazard = hazard_type.lower()

        if hazard in self.models and hazard in self.features:
            model = self.models[hazard]
            feature_cols = self.features[hazard]

            # Build feature vector
            df_input = self._build_feature_vector(hazard, data)

            # Get base ML probability
            base_prob = float(model.predict_proba(df_input)[0, 1])

            # Feature importance explanation
            importance = {}
            base_estimator = model
            # Handle CalibratedClassifierCV wrapper
            if hasattr(model, "estimators_") and hasattr(model, "calibrated_classifiers_"):
                # CalibratedClassifierCV — get the base estimator
                if len(model.calibrated_classifiers_) > 0:
                    base_estimator = model.calibrated_classifiers_[0].estimator
            if hasattr(base_estimator, "feature_importances_"):
                fi = base_estimator.feature_importances_
                top_idx = np.argsort(fi)[::-1][:5]
                for idx in top_idx:
                    if idx < len(feature_cols):
                        importance[feature_cols[idx]] = round(float(fi[idx]), 3)

            best_model_name = self.comparisons.get(hazard, {}).get("best", "XGBoost")
            dataset_source = self.comparisons.get(hazard, {}).get("dataset_source", "Government Data")
            is_synthetic = self.comparisons.get(hazard, {}).get("synthetic_data_used", False)

            result = {
                "hazard_type": hazard.upper(),
                "probability": round(base_prob, 4),
                "risk_score": int(base_prob * 100),
                "confidence": 0.90 if not is_synthetic else 0.65,
                "model_used": best_model_name,
                "model_version": self.comparisons.get(hazard, {}).get("version", "v3.0"),
                "dataset_source": dataset_source,
                "synthetic_data_used": is_synthetic,
                "top_factors": importance,
            }

            # ── Apply live weather dynamic risk adjustment ────────────
            if use_weather:
                lat = data.get("latitude", data.get("lat"))
                lon = data.get("longitude", data.get("lon", data.get("lng")))
                if lat is not None and lon is not None:
                    try:
                        adjustment = weather_adjuster.adjust_probability(
                            hazard, base_prob, float(lat), float(lon)
                        )
                        result["base_probability"] = result["probability"]
                        result["probability"] = adjustment["adjusted_probability"]
                        result["risk_score"] = int(adjustment["adjusted_probability"] * 100)
                        result["adjustment_multiplier"] = adjustment["adjustment_multiplier"]
                        result["weather_correlation"] = adjustment["weather_correlation"]
                        result["live_weather"] = adjustment["live_weather"]
                    except Exception as e:
                        result["weather_adjustment_error"] = str(e)

            return result
        else:
            return self._fallback_prediction(hazard, data)

    def predict_realtime(self, hazard_type: str, data: dict) -> dict:
        """Convenience method that always applies weather adjustment."""
        return self.predict_hazard(hazard_type, data, use_weather=True)

    def _fallback_prediction(self, hazard: str, data: dict) -> dict:
        """Rule-based fallback when models are not loaded."""
        rainfall = data.get("rainfall", data.get("rainfall_mm", 10))
        temp = data.get("temperature", data.get("temperature_c", 30))
        humidity = data.get("humidity", data.get("humidity_pct", 60))

        try:
            rainfall = float(rainfall)
            temp = float(temp)
            humidity = float(humidity)
        except (ValueError, TypeError):
            rainfall, temp, humidity = 10, 30, 60

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
            "confidence": 0.55,
            "model_used": "Rule-Based Fallback",
            "model_version": "fallback",
            "dataset_source": "N/A",
            "synthetic_data_used": False,
            "top_factors": {"rainfall": rainfall, "temperature": temp, "humidity": humidity},
        }

    def predict_unified(self, data: dict, use_weather: bool = False) -> dict:
        """Predict all three hazards at once."""
        result = {}
        for h in ["flood", "landslide", "wildfire"]:
            result[h] = self.predict_hazard(h, data, use_weather=use_weather)
        return result

    def predict_unified_realtime(self, data: dict) -> dict:
        """Predict all hazards with live weather adjustment."""
        return self.predict_unified(data, use_weather=True)

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

    def get_thresholds(self) -> dict:
        """Return training-data-derived percentile thresholds."""
        return weather_adjuster.get_all_thresholds()


predictor = RiskPredictor()
