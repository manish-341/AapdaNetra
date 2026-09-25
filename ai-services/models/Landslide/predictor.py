
import os
import json
import numpy as np
import pandas as pd
import xgboost as xgb


BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(
    BASE_DIR,
    "model",
    "landslide_xgb_spatial_model.json"
)

CONFIG_PATH = os.path.join(
    BASE_DIR,
    "model",
    "landslide_model_config.json"
)


FEATURES = [
    "srtm_elevation_m",
    "srtm_slope_deg",
    "rainfall_24h_mm",
    "rainfall_3day_mm",
    "rainfall_7day_mm",
]


# Operational alert thresholds.
# These are configurable policy thresholds, not scientifically
# validated universal thresholds.
WATCH_THRESHOLD = 0.35
ALERT_THRESHOLD = 0.50


class LandslidePredictor:

    def __init__(self):
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(
                f"Model file not found: {MODEL_PATH}"
            )

        self.model = xgb.XGBClassifier()
        self.model.load_model(MODEL_PATH)

        self.config = {}

        if os.path.exists(CONFIG_PATH):
            with open(CONFIG_PATH, "r") as f:
                self.config = json.load(f)


    def predict(
        self,
        elevation_m,
        slope_deg,
        rainfall_24h_mm,
        rainfall_3day_mm,
        rainfall_7day_mm
    ):

        values = {
            "srtm_elevation_m": float(elevation_m),
            "srtm_slope_deg": float(slope_deg),
            "rainfall_24h_mm": float(rainfall_24h_mm),
            "rainfall_3day_mm": float(rainfall_3day_mm),
            "rainfall_7day_mm": float(rainfall_7day_mm),
        }

        # Validate input
        for feature in FEATURES:
            value = values[feature]

            if not np.isfinite(value):
                raise ValueError(
                    f"Invalid value for {feature}: {value}"
                )

        # Create dataframe in the exact training-feature order
        X = pd.DataFrame(
            [[values[feature] for feature in FEATURES]],
            columns=FEATURES
        )

        # Raw XGBoost output is treated as a risk score.
        # It is NOT claimed to be a calibrated real-world probability.
        risk_score = float(
            self.model.predict_proba(X)[0, 1]
        )

        if risk_score >= ALERT_THRESHOLD:
            risk_level = "ALERT"
        elif risk_score >= WATCH_THRESHOLD:
            risk_level = "WATCH"
        else:
            risk_level = "NORMAL"

        return {
            "risk_score": round(risk_score, 4),
            "risk_level": risk_level,
            "calibrated_probability": False,
            "thresholds": {
                "watch": WATCH_THRESHOLD,
                "alert": ALERT_THRESHOLD
            },
            "features": values
        }


predictor = LandslidePredictor()
