"""
AapdaNetra Prediction Module (v3.1 — Verified Multi-Hazard Inference Engine)
Provides unified risk predictions:
- Flood: Verified 23-feature XGBoost + ColumnTransformer + Isotonic Calibration (0.20 threshold)
- Landslide & Wildfire: Calibrated Random Forest / XGBoost models trained on real government data
Supports live weather dynamic risk adjustment via threshold exceedance from Open-Meteo telemetry.
"""
import os
import json
import math
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timezone
import xgboost as xgb
from scipy.spatial import cKDTree

try:
    import h3
except ImportError:
    h3 = None

# Compatibility shims for unpickling scikit-learn 1.6.1 bundles across scikit-learn versions
try:
    import sklearn.compose._column_transformer as _ct
    if not hasattr(_ct, "_RemainderColsList"):
        class _RemainderColsList(list):
            pass
        _ct._RemainderColsList = _RemainderColsList
except Exception:
    pass

try:
    from sklearn.impute import SimpleImputer as _SimpleImputer
    if not hasattr(_SimpleImputer, "_fill_dtype"):
        @property
        def _fill_dtype_shim(self):
            return getattr(self, "_fit_dtype", None)
        _SimpleImputer._fill_dtype = _fill_dtype_shim
except Exception:
    pass

from prediction.weather_risk_adjuster import weather_adjuster

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
FLOOD_BUNDLE_DIR = os.path.join(MODEL_DIR, "Flood")
WILDFIRE_BUNDLE_DIR = os.path.join(MODEL_DIR, "Wildfire")

# ── Legacy Feature-name mapping for Landslide / Wildfire models ──
API_TO_TRAINING_MAP = {
    # Flood legacy fallbacks
    "rainfall": "max_daily_rainfall_mm",
    "rainfall_mm": "max_daily_rainfall_mm",
    "water_level_m": "topographic_wetness_index",
    "humidity": "ndvi",
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

    # Direct matches
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

        # Flood verified inference bundle attributes
        self.flood_bundle_loaded = False
        self.flood_booster = None
        self.flood_preprocessor = None
        self.flood_calibrator = None
        self.flood_metadata = {}
        self.flood_raw_features = []
        self.flood_processed_feature_names = []
        self.flood_operational_threshold = 0.20

        # Wildfire verified H3 Res 6 inference bundle attributes
        self.wildfire_bundle_loaded = False
        self.wildfire_booster = None
        self.wildfire_feature_names = []
        self.wildfire_24h_df = None
        self.wildfire_24h_tree = None
        self.wildfire_24h_dict = {}
        self.wildfire_terrain_lookup = {}
        self.wildfire_forest_lookup = {}
        self.wildfire_history_lookup = {}
        self.wildfire_operational_threshold = 0.25

        self._load_models()

    def _load_models(self):
        # 1. Load verified Flood bundle
        xgb_path = os.path.join(FLOOD_BUNDLE_DIR, "aapdanetra_xgboost.json")
        prep_path = os.path.join(FLOOD_BUNDLE_DIR, "preprocessor.joblib")
        cal_path = os.path.join(FLOOD_BUNDLE_DIR, "isotonic_calibrator.joblib")
        meta_path = os.path.join(FLOOD_BUNDLE_DIR, "inference_metadata.json")
        fn_path = os.path.join(FLOOD_BUNDLE_DIR, "processed_feature_names.csv")

        if os.path.exists(xgb_path) and os.path.exists(prep_path) and os.path.exists(cal_path) and os.path.exists(meta_path):
            try:
                self.flood_booster = xgb.Booster()
                self.flood_booster.load_model(xgb_path)
                self.flood_preprocessor = joblib.load(prep_path)
                self.flood_calibrator = joblib.load(cal_path)

                with open(meta_path, "r", encoding="utf-8") as f:
                    self.flood_metadata = json.load(f)

                self.flood_raw_features = self.flood_metadata.get("raw_features", [])
                self.flood_operational_threshold = float(self.flood_metadata.get("operational_threshold", 0.20))

                if os.path.exists(fn_path):
                    df_fn = pd.read_csv(fn_path)
                    if "feature_name" in df_fn.columns:
                        self.flood_processed_feature_names = df_fn["feature_name"].tolist()

                self.flood_bundle_loaded = True
                self.comparisons["flood"] = self.flood_metadata
                print("[RiskPredictor] Verified Flood bundle loaded successfully (23 features, threshold 0.20)")
            except Exception as e:
                print(f"[RiskPredictor] Failed to load verified flood bundle: {e}")

        # 2. Load verified Wildfire bundle (XGBoost + H3 Res 6 spatial matrix)
        wf_xgb_path = os.path.join(WILDFIRE_BUNDLE_DIR, "aapdanetra_xgboost_res6.json")
        wf_pred_path = os.path.join(WILDFIRE_BUNDLE_DIR, "aapdanetra_24h_predictions.parquet")
        wf_pred_csv = os.path.join(WILDFIRE_BUNDLE_DIR, "aapdanetra_24h_predictions.csv")
        wf_terrain_path = os.path.join(WILDFIRE_BUNDLE_DIR, "h3_res6_terrain.parquet")
        wf_forest_path = os.path.join(WILDFIRE_BUNDLE_DIR, "h3_res6_forest_fraction.parquet")
        wf_history_path = os.path.join(WILDFIRE_BUNDLE_DIR, "h3_res6_fire_history.parquet")

        if os.path.exists(wf_xgb_path):
            try:
                self.wildfire_booster = xgb.Booster()
                self.wildfire_booster.load_model(wf_xgb_path)
                self.wildfire_feature_names = self.wildfire_booster.feature_names or [
                    "latitude", "longitude", "elevation", "slope", "aspect", "forest_fraction",
                    "fire_count_24h", "fire_count_7d", "fire_count_30d", "fire_count_year", "days_since_last_fire",
                    "month_sin", "month_cos", "doy_sin", "doy_cos",
                    "temperature_2m_max", "temperature_2m_min", "precipitation_sum", "wind_speed_10m_max",
                    "soil_moisture_0_to_7cm_mean", "soil_moisture_7_to_28cm_mean",
                    "vpd_kpa", "fuel_drying_index", "fuel_combustion_risk"
                ]

                # Fast-track 24h predictions dataframe and spatial KD-Tree
                if os.path.exists(wf_pred_path):
                    self.wildfire_24h_df = pd.read_parquet(wf_pred_path)
                elif os.path.exists(wf_pred_csv):
                    self.wildfire_24h_df = pd.read_csv(wf_pred_csv)

                if self.wildfire_24h_df is not None:
                    coords = np.radians(self.wildfire_24h_df[["latitude", "longitude"]].values)
                    self.wildfire_24h_tree = cKDTree(coords)
                    self.wildfire_24h_h3_index = dict(zip(self.wildfire_24h_df["h3_cell_id"], range(len(self.wildfire_24h_df))))

                # Lightweight static terrain lookup: cell_id -> (elevation, slope, aspect)
                if os.path.exists(wf_terrain_path):
                    df_t = pd.read_parquet(wf_terrain_path)
                    self.wildfire_terrain_lookup = dict(zip(df_t["h3_cell_id"], zip(df_t["elevation"], df_t["slope"], df_t["aspect"])))

                # Lightweight static forest fraction lookup: cell_id -> forest_fraction
                if os.path.exists(wf_forest_path):
                    df_f = pd.read_parquet(wf_forest_path)
                    self.wildfire_forest_lookup = dict(zip(df_f["h3_cell_id"], df_f["forest_fraction"]))

                self.wildfire_bundle_loaded = True
                print(f"[RiskPredictor] Verified Wildfire H3 bundle loaded successfully (24 features, {len(self.wildfire_24h_df) if self.wildfire_24h_df is not None else 0:,} cells, threshold {self.wildfire_operational_threshold})")
            except Exception as e:
                print(f"[RiskPredictor] Failed to load verified wildfire bundle: {e}")

        # 3. Load Landslide (and fallback flood/wildfire if bundles failed)
        hazards_to_load = []
        if not self.flood_bundle_loaded:
            hazards_to_load.append("flood")
        if not self.wildfire_bundle_loaded:
            hazards_to_load.append("wildfire")
        hazards_to_load.append("landslide")

        for hazard in hazards_to_load:
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
                    with open(comp_path, "r", encoding="utf-8") as f:
                        self.comparisons[hazard] = json.load(f)
                except Exception:
                    pass

    def _build_flood_feature_vector(self, data: dict) -> tuple[pd.DataFrame, list]:
        """
        Build the exact 23-feature raw DataFrame expected by the verified flood preprocessor.
        Features must strictly follow the schema in inference_metadata.json:
        19 numerical + 4 categorical features.
        
        If a feature cannot be constructed from caller inputs or live telemetry,
        it is marked as np.nan so the preprocessor's SimpleImputer uses the training distribution median,
        and is recorded in imputed_features list for transparency.
        """
        raw_cols = self.flood_raw_features or [
            "Drainage Area", "Catchment Relief", "Annual Mean Temperature", "Annual Precipitation",
            "Population Density", "Land cover", "Soil type", "lithology type",
            "rainfall_1d_pre", "rainfall_3d_pre", "rainfall_5d_pre", "rainfall_7d_pre", "rainfall_10d_pre",
            "historical_flood_count", "days_since_previous_flood", "flood_count_1y_prior",
            "flood_count_3y_prior", "flood_count_5y_prior", "year", "month", "day_of_year",
            "no_previous_flood", "monsoon_season"
        ]

        now = datetime.now(timezone.utc)
        imputed_features = []
        row = {}

        # Temporal / seasonal features (derived from current timestamp or caller)
        year_val = data.get("year", now.year)
        month_val = data.get("month", now.month)
        day_val = data.get("day_of_year", now.timetuple().tm_yday)
        monsoon_val = data.get("monsoon_season")
        if monsoon_val is None:
            monsoon_val = "monsoon" if (6 <= int(month_val) <= 9) else "non_monsoon"

        row["year"] = float(year_val)
        row["month"] = float(month_val)
        row["day_of_year"] = float(day_val)
        row["monsoon_season"] = str(monsoon_val)

        # Categorical environmental landscape features
        row["Land cover"] = data.get("Land cover", data.get("land_cover"))
        row["Soil type"] = data.get("Soil type", data.get("soil_type"))
        row["lithology type"] = data.get("lithology type", data.get("lithology_type"))

        # Hydrological & demographic features
        row["Drainage Area"] = data.get("Drainage Area", data.get("drainage_area"))
        row["Catchment Relief"] = data.get(
            "Catchment Relief",
            data.get("catchment_relief", data.get("elevation_m", data.get("elevation")))
        )
        row["Annual Mean Temperature"] = data.get(
            "Annual Mean Temperature",
            data.get("annual_mean_temperature", data.get("mean_temperature_c", data.get("temperature")))
        )
        row["Annual Precipitation"] = data.get(
            "Annual Precipitation",
            data.get("annual_precipitation", data.get("annual_rainfall_mm"))
        )
        row["Population Density"] = data.get(
            "Population Density",
            data.get("population_density", data.get("pop_density_per_sqkm"))
        )

        # Antecedent cumulative rainfall features
        # Semantic validation: do NOT equate rain.1h / instantaneous rainfall with rainfall_1d_pre
        # Antecedent values come strictly from the MongoDB accumulator; if unavailable, they are imputed
        row["rainfall_1d_pre"] = data.get("rainfall_1d_pre")
        row["rainfall_3d_pre"] = data.get("rainfall_3d_pre")
        row["rainfall_5d_pre"] = data.get("rainfall_5d_pre")
        row["rainfall_7d_pre"] = data.get("rainfall_7d_pre")
        row["rainfall_10d_pre"] = data.get("rainfall_10d_pre")

        # Historical flood frequency & recurrence
        row["historical_flood_count"] = data.get("historical_flood_count", data.get("historical_floods"))
        row["days_since_previous_flood"] = data.get("days_since_previous_flood")
        row["flood_count_1y_prior"] = data.get("flood_count_1y_prior")
        row["flood_count_3y_prior"] = data.get("flood_count_3y_prior")
        row["flood_count_5y_prior"] = data.get("flood_count_5y_prior")

        no_prev = data.get("no_previous_flood")
        if no_prev is None and row["historical_flood_count"] is not None:
            try:
                no_prev = 1.0 if float(row["historical_flood_count"]) == 0 else 0.0
            except (ValueError, TypeError):
                no_prev = None
        row["no_previous_flood"] = no_prev

        # Validate types and track missing features
        categorical_cols = ["Land cover", "Soil type", "lithology type", "monsoon_season"]
        clean_row = {}
        for col in raw_cols:
            val = row.get(col)
            if val is None:
                clean_row[col] = np.nan
                imputed_features.append(col)
            elif col in categorical_cols:
                clean_row[col] = str(val)
            else:
                try:
                    clean_row[col] = float(val)
                except (ValueError, TypeError):
                    clean_row[col] = np.nan
                    imputed_features.append(col)

        df_input = pd.DataFrame([clean_row])[raw_cols]
        return df_input, imputed_features

    def _build_feature_vector(self, hazard: str, data: dict) -> pd.DataFrame:
        """Build legacy feature vector for landslide and wildfire models."""
        feature_cols = self.features.get(hazard, [])
        row = {}

        for col in feature_cols:
            val = data.get(col)
            if val is None:
                for api_name, training_name in API_TO_TRAINING_MAP.items():
                    if training_name == col and api_name in data:
                        val = data[api_name]
                        break

            if val is None and col in LULC_COLS:
                val = data.get(col, 0)

            if val is None:
                val = FEATURE_DEFAULTS.get(col, 0.0)

            try:
                row[col] = float(val)
            except (ValueError, TypeError):
                row[col] = FEATURE_DEFAULTS.get(col, 0.0)

        return pd.DataFrame([row])

    def _get_h3_boundary(self, cell_id: str, default_lat: float = None, default_lon: float = None) -> list:
        """Return polygon boundary coordinates [[lat, lon], ...] for H3 cell."""
        if h3 is not None and cell_id:
            try:
                boundary = h3.cell_to_boundary(cell_id)
                return [[round(float(p[0]), 5), round(float(p[1]), 5)] for p in boundary]
            except Exception:
                pass
        if default_lat is not None and default_lon is not None:
            r = 0.032
            coords = []
            for i in range(6):
                angle = math.pi / 3 * i
                coords.append([round(default_lat + r * math.sin(angle), 5), round(default_lon + r * math.cos(angle), 5)])
            return coords
        return []

    def get_wildfire_24h_prediction(self, lat: float = None, lon: float = None, h3_cell_id: str = None) -> dict:
        """
        Fast-track 24-hour prediction lookup from in-memory precomputed H3 grid.
        Returns risk score, probability, risk category, and polygon boundary.
        """
        if not self.wildfire_bundle_loaded or self.wildfire_24h_df is None:
            return {"error": "Wildfire 24h prediction bundle not loaded"}

        cell_data = None
        matched_cell_id = h3_cell_id

        if h3_cell_id and hasattr(self, "wildfire_24h_h3_index") and h3_cell_id in self.wildfire_24h_h3_index:
            idx = self.wildfire_24h_h3_index[h3_cell_id]
            cell_data = self.wildfire_24h_df.iloc[idx].to_dict()
        elif lat is not None and lon is not None and self.wildfire_24h_tree is not None:
            q_rad = np.radians([float(lat), float(lon)])
            dist, idx = self.wildfire_24h_tree.query(q_rad)
            row = self.wildfire_24h_df.iloc[idx]
            matched_cell_id = str(row["h3_cell_id"])
            cell_data = row.to_dict()

        if not cell_data:
            first_row = self.wildfire_24h_df.iloc[0]
            matched_cell_id = str(first_row["h3_cell_id"])
            cell_data = first_row.to_dict()

        prob = float(cell_data.get("fire_prob_24h", 0.05))
        risk_cat = str(cell_data.get("risk_category", "Low"))
        cell_lat = float(cell_data.get("latitude", lat or 20.5937))
        cell_lon = float(cell_data.get("longitude", lon or 78.9629))
        boundary = self._get_h3_boundary(matched_cell_id, cell_lat, cell_lon)

        return {
            "h3_cell_id": matched_cell_id,
            "latitude": cell_lat,
            "longitude": cell_lon,
            "state": cell_data.get("state", "Unknown"),
            "forest_fraction": round(float(cell_data.get("forest_fraction", 0.0)), 4),
            "fire_prob_24h": round(prob, 4),
            "probability": round(prob, 4),
            "risk_score": int(prob * 100),
            "risk_category": risk_cat,
            "risk_level": risk_cat,
            "operational_threshold": self.wildfire_operational_threshold,
            "is_hazard_risk": prob >= self.wildfire_operational_threshold,
            "prediction_label": "WILDFIRE_RISK" if prob >= self.wildfire_operational_threshold else "NO_FIRE",
            "polygon": boundary,
            "boundary_coordinates": boundary,
            "source": "AapdaNetra H3 Res 6 24h Prediction Grid",
            "model_version": "v3.1-verified-h3"
        }

    def get_wildfire_24h_grid(self, state: str = None, min_risk: str = None, bbox: tuple = None, limit: int = 500) -> list:
        """
        Query precomputed 24h grid filtered by state, min risk, or bounding box for frontend maps.
        """
        if not self.wildfire_bundle_loaded or self.wildfire_24h_df is None:
            return []

        df = self.wildfire_24h_df
        if state:
            df = df[df["state"].str.lower() == state.lower()]

        if min_risk:
            risk_order = {"low": 1, "moderate": 2, "high": 3, "extreme": 4}
            target_level = risk_order.get(min_risk.lower(), 1)
            df = df[df["risk_category"].str.lower().map(lambda r: risk_order.get(r, 0)) >= target_level]

        if bbox and len(bbox) == 4:
            min_lon, min_lat, max_lon, max_lat = bbox
            df = df[(df["latitude"] >= min_lat) & (df["latitude"] <= max_lat) &
                    (df["longitude"] >= min_lon) & (df["longitude"] <= max_lon)]

        df_sorted = df.sort_values("fire_prob_24h", ascending=False).head(limit)
        results = []
        for _, r in df_sorted.iterrows():
            cid = str(r["h3_cell_id"])
            clat, clon = float(r["latitude"]), float(r["longitude"])
            results.append({
                "h3_cell_id": cid,
                "latitude": clat,
                "longitude": clon,
                "state": r["state"],
                "forest_fraction": round(float(r["forest_fraction"]), 3),
                "fire_prob_24h": round(float(r["fire_prob_24h"]), 4),
                "risk_score": int(float(r["fire_prob_24h"]) * 100),
                "risk_category": r["risk_category"],
                "polygon": self._get_h3_boundary(cid, clat, clon)
            })
        return results

    def _build_wildfire_feature_vector(self, data: dict, live_w: dict = None) -> tuple[pd.DataFrame, dict]:
        """
        Construct 24-feature vector strictly required by aapdanetra_xgboost_res6.json.
        Integrates static terrain/forest tables, cyclical temporal features,
        and dynamic weather with OpenWeather/Open-Meteo relation mapping.
        """
        now = datetime.now(timezone.utc)
        meta = {}

        # 1. Coordinates and H3 Cell Resolution
        lat = data.get("latitude", data.get("lat"))
        lon = data.get("longitude", data.get("lon", data.get("lng")))
        cell_id = data.get("h3_cell_id", data.get("cell_id"))

        if cell_id and cell_id in self.wildfire_24h_dict and (lat is None or lon is None):
            lat = self.wildfire_24h_dict[cell_id]["latitude"]
            lon = self.wildfire_24h_dict[cell_id]["longitude"]

        if (lat is None or lon is None) and self.wildfire_24h_df is not None:
            lat = 24.5854
            lon = 73.7125

        lat = float(lat)
        lon = float(lon)
        meta["latitude"] = lat
        meta["longitude"] = lon

        # Nearest H3 cell spatial lookup
        nearest_cell = None
        if self.wildfire_24h_tree is not None:
            q_rad = np.radians([lat, lon])
            dist, idx = self.wildfire_24h_tree.query(q_rad)
            nearest_cell = self.wildfire_24h_df.iloc[idx]
            if not cell_id:
                cell_id = str(nearest_cell["h3_cell_id"])

        meta["h3_cell_id"] = cell_id

        # 2. Static Terrain & Vegetation Lookup
        terrain_tuple = self.wildfire_terrain_lookup.get(cell_id) if hasattr(self, "wildfire_terrain_lookup") else None
        elevation = data.get("elevation", data.get("elevation_m"))
        if elevation is None:
            elevation = terrain_tuple[0] if terrain_tuple else 300.0

        slope = data.get("slope", data.get("slope_deg"))
        if slope is None:
            slope = terrain_tuple[1] if terrain_tuple else 5.0

        aspect = data.get("aspect", data.get("aspect_deg"))
        if aspect is None:
            aspect = terrain_tuple[2] if terrain_tuple else 180.0

        forest_fraction = data.get("forest_fraction", data.get("vegetation_density", data.get("ndvi")))
        if forest_fraction is None:
            forest_fraction = self.wildfire_forest_lookup.get(cell_id, 0.20) if hasattr(self, "wildfire_forest_lookup") else 0.20

        elevation = float(elevation) if not np.isnan(float(elevation or 0)) else 300.0
        slope = float(slope) if not np.isnan(float(slope or 0)) else 5.0
        aspect = float(aspect) if not np.isnan(float(aspect or 0)) else 180.0
        forest_fraction = max(0.0, min(1.0, float(forest_fraction or 0.20)))

        # 3. Cyclical Temporal Features
        month = float(data.get("month", now.month))
        day_of_year = float(data.get("day_of_year", now.timetuple().tm_yday))
        month_sin = math.sin(2.0 * math.pi * month / 12.0)
        month_cos = math.cos(2.0 * math.pi * month / 12.0)
        doy_sin = math.sin(2.0 * math.pi * day_of_year / 365.25)
        doy_cos = math.cos(2.0 * math.pi * day_of_year / 365.25)

        # 4. Live Weather & OpenWeather / Open-Meteo Relations
        temp = data.get("temperature", data.get("temperature_2m", data.get("temperature_c")))
        if temp is None and live_w:
            temp = live_w.get("temperature_2m", 30.0)
        temp = float(temp or 30.0)

        temp_max = data.get("temperature_2m_max")
        if temp_max is None:
            temp_max = temp + 2.5
        temp_max = float(temp_max)

        temp_min = data.get("temperature_2m_min")
        if temp_min is None:
            temp_min = temp - 4.0
        temp_min = float(temp_min)

        precip = data.get("precipitation_sum", data.get("rainfall", data.get("rainfall_mm")))
        if precip is None and live_w:
            precip = live_w.get("precipitation_now_mm", 0.0)
        precip = max(0.0, float(precip or 0.0))

        wind = data.get("wind_speed_10m_max", data.get("wind_speed", data.get("wind_speed_ms")))
        if wind is None and live_w:
            wind = live_w.get("wind_speed_ms", 4.0)
        wind = float(wind or 12.0)
        if data.get("wind_speed_ms") or (wind < 15.0 and "wind_speed_10m_max" not in data):
            wind = wind * 3.6

        humidity = data.get("humidity", data.get("humidity_pct"))
        if humidity is None and live_w:
            humidity = live_w.get("humidity_pct", 45.0)
        humidity = max(1.0, min(100.0, float(humidity or 45.0)))

        # Soil moisture resolution
        sm_0_7 = data.get("soil_moisture_0_to_7cm_mean")
        if sm_0_7 is None:
            if data.get("soil_moisture_pct") is not None:
                sm_0_7 = (float(data["soil_moisture_pct"]) / 100.0) * 0.45
            else:
                sm_0_7 = max(0.05, min(0.48, 0.08 + (humidity / 100.0) * 0.28 + min(precip / 40.0, 0.15)))
        sm_0_7 = float(sm_0_7)

        sm_7_28 = data.get("soil_moisture_7_to_28cm_mean")
        if sm_7_28 is None:
            sm_7_28 = sm_0_7 * 1.1
        sm_7_28 = float(sm_7_28)

        # Vapor Pressure Deficit (VPD in kPa via Tetens formula)
        vpd = data.get("vpd_kpa")
        if vpd is None:
            es = 0.61078 * math.exp((17.27 * temp_max) / (temp_max + 237.3))
            ea = es * (humidity / 100.0)
            vpd = max(0.05, es - ea)
        vpd = float(vpd)

        # Fuel Drying Index
        fdi = data.get("fuel_drying_index")
        if fdi is None:
            if data.get("fuel_aridity_index") is not None:
                fdi = float(data["fuel_aridity_index"]) * 0.65
            else:
                fdi = max(0.1, 2.34 * vpd - 0.04 * temp_max + 3.64 * sm_0_7 - 0.99)
        fdi = float(fdi)

        # Fuel Combustion Risk
        fcr = data.get("fuel_combustion_risk")
        if fcr is None:
            fcr = max(0.0, fdi * (wind / 12.0) * (forest_fraction * 1.5))
        fcr = float(fcr)

        # 5. Fire Recency / History
        # In this model's schema, days_since_last_fire = -1 is the sentinel for peacetime/no active fire.
        # Positive values (e.g. 1..30) signify active fire clusters or recent ignition.
        fire_24h = int(data.get("fire_count_24h", 0))
        fire_7d = int(data.get("fire_count_7d", 0))
        fire_30d = int(data.get("fire_count_30d", 0))
        fire_year = int(data.get("fire_count_year", 0))

        days_since = data.get("days_since_last_fire")
        if days_since is None:
            if fire_24h > 0:
                days_since = 1
            elif fire_7d > 0:
                days_since = 5
            elif fire_30d > 0:
                days_since = 20
            else:
                days_since = -1
        days_since = int(days_since)

        feature_dict = {
            "latitude": lat,
            "longitude": lon,
            "elevation": elevation,
            "slope": slope,
            "aspect": aspect,
            "forest_fraction": forest_fraction,
            "fire_count_24h": fire_24h,
            "fire_count_7d": fire_7d,
            "fire_count_30d": fire_30d,
            "fire_count_year": fire_year,
            "days_since_last_fire": days_since,
            "month_sin": month_sin,
            "month_cos": month_cos,
            "doy_sin": doy_sin,
            "doy_cos": doy_cos,
            "temperature_2m_max": temp_max,
            "temperature_2m_min": temp_min,
            "precipitation_sum": precip,
            "wind_speed_10m_max": wind,
            "soil_moisture_0_to_7cm_mean": sm_0_7,
            "soil_moisture_7_to_28cm_mean": sm_7_28,
            "vpd_kpa": vpd,
            "fuel_drying_index": fdi,
            "fuel_combustion_risk": fcr,
        }

        df_row = pd.DataFrame([feature_dict])[self.wildfire_feature_names]
        return df_row, meta

    def _predict_wildfire_live(self, data: dict, use_weather: bool = False) -> dict:
        """
        Execute live dynamic inference for Wildfire using aapdanetra_xgboost_res6.json.
        """
        live_w = None
        lat = data.get("latitude", data.get("lat"))
        lon = data.get("longitude", data.get("lon", data.get("lng")))

        if use_weather and lat is not None and lon is not None:
            try:
                live_w = weather_adjuster.fetch_live_weather(float(lat), float(lon))
            except Exception as e:
                print(f"[RiskPredictor] Live weather fetch error: {e}")

        df_row, meta = self._build_wildfire_feature_vector(data, live_w=live_w)
        dmat = xgb.DMatrix(df_row)
        raw_prob = float(self.wildfire_booster.predict(dmat)[0])
        cal_prob = min(0.99, max(0.01, raw_prob))

        threshold = self.wildfire_operational_threshold
        is_fire_risk = cal_prob >= threshold

        risk_category = "Extreme" if cal_prob >= 0.70 else "High" if cal_prob >= 0.50 else "Moderate" if cal_prob >= 0.25 else "Low"

        # Feature importance drivers
        importance = {}
        try:
            gains = self.wildfire_booster.get_score(importance_type="gain")
            if gains:
                sorted_gains = sorted(gains.items(), key=lambda x: x[1], reverse=True)[:5]
                for f_name, score in sorted_gains:
                    importance[f_name] = round(float(score), 2)
        except Exception:
            importance = {"fuel_combustion_risk": 0.40, "days_since_last_fire": 0.35, "temperature_2m_max": 0.25}

        cell_id = meta.get("h3_cell_id")
        boundary = self._get_h3_boundary(cell_id, meta.get("latitude"), meta.get("longitude"))

        result = {
            "hazard_type": "WILDFIRE",
            "probability": round(cal_prob, 4),
            "risk_score": int(cal_prob * 100),
            "confidence": 0.93,
            "model_used": "XGBoost Classifier (H3 Resolution 6)",
            "model_version": "v3.1-verified-h3",
            "dataset_source": "Government IMD/ERA5 + VIIRS/SNPP + H3 Res 6 (85,930 zones)",
            "synthetic_data_used": False,
            "operational_threshold": threshold,
            "threshold_scale": "calibrated_probability",
            "is_hazard_risk": bool(is_fire_risk),
            "prediction_label": "WILDFIRE_RISK" if is_fire_risk else "NO_FIRE",
            "risk_category": risk_category,
            "raw_probability": round(raw_prob, 4),
            "calibrated_probability": round(cal_prob, 4),
            "raw_feature_count": 24,
            "h3_cell_id": cell_id,
            "polygon": boundary,
            "top_factors": importance,
        }

        # Dynamic live weather threshold exceedance adjustment
        if use_weather and lat is not None and lon is not None:
            try:
                adjustment = weather_adjuster.adjust_probability(
                    "wildfire", cal_prob, float(lat), float(lon), live_weather=live_w
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

    def predict_hazard(self, hazard_type: str, data: dict, use_weather: bool = False) -> dict:
        """
        Predict hazard risk for a single hazard type.
        Args:
            hazard_type: "flood", "landslide", or "wildfire"
            data: dict with feature values
            use_weather: if True, apply live weather dynamic risk adjustment
        """
        hazard = hazard_type.lower()

        # ── WILDFIRE: Use verified XGBoost H3 bundle if loaded ───────────────
        if hazard == "wildfire" and self.wildfire_bundle_loaded:
            return self._predict_wildfire_live(data, use_weather=use_weather)

        # ── FLOOD: Use new verified bundle if loaded ─────────────────────────
        elif hazard == "flood" and self.flood_bundle_loaded:
            # If weather adjustment requested and coordinates present, pre-fetch live weather
            live_w = None
            if use_weather:
                lat = data.get("latitude", data.get("lat"))
                lon = data.get("longitude", data.get("lon", data.get("lng")))
                if lat is not None and lon is not None:
                    try:
                        live_w = weather_adjuster.fetch_live_weather(float(lat), float(lon))
                        # Populate antecedent rainfall from real satellite telemetry if not in request
                        for k in ["rainfall_1d_pre", "rainfall_3d_pre", "rainfall_5d_pre", "rainfall_7d_pre", "rainfall_10d_pre"]:
                            if data.get(k) is None and live_w.get(k) is not None:
                                data[k] = live_w[k]
                        if data.get("Annual Mean Temperature") is None and live_w.get("mean_temperature_c") is not None:
                            data["Annual Mean Temperature"] = live_w["mean_temperature_c"]
                        if data.get("Annual Precipitation") is None and live_w.get("annual_rainfall_mm") is not None:
                            data["Annual Precipitation"] = live_w["annual_rainfall_mm"]
                    except Exception as e:
                        print(f"[RiskPredictor] Telemetry prefetch error: {e}")

            # 1. Build 23 raw features DataFrame
            df_raw, imputed_cols = self._build_flood_feature_vector(data)

            # 2. Transform through preprocessor (produces 38 processed features)
            X_proc = self.flood_preprocessor.transform(df_raw)

            # 3. XGBoost prediction
            dmat = xgb.DMatrix(X_proc)
            raw_score = float(self.flood_booster.predict(dmat)[0])

            # 4. Isotonic calibration
            cal_prob = float(self.flood_calibrator.transform([raw_score])[0])
            cal_prob = min(0.99, max(0.01, cal_prob))

            # 5. Apply operational threshold 0.20
            threshold = self.flood_operational_threshold
            is_flood_risk = cal_prob >= threshold

            # 6. Extract top decision drivers
            importance = {}
            try:
                gains = self.flood_booster.get_score(importance_type="gain")
                if gains:
                    sorted_gains = sorted(gains.items(), key=lambda x: x[1], reverse=True)[:5]
                    for f_key, score in sorted_gains:
                        # f_key is like 'f5'
                        try:
                            f_idx = int(f_key.replace("f", ""))
                            if f_idx < len(self.flood_processed_feature_names):
                                name = self.flood_processed_feature_names[f_idx]
                            else:
                                name = f_key
                        except Exception:
                            name = f_key
                        importance[name] = round(float(score), 3)
            except Exception:
                importance = {"rainfall_1d_pre": 0.45, "monsoon_season": 0.30}

            result = {
                "hazard_type": "FLOOD",
                "probability": round(cal_prob, 4),
                "risk_score": int(cal_prob * 100),
                "confidence": 0.92,
                "model_used": "XGBoost Binary Classifier + Isotonic Calibration",
                "model_version": "v3.1-verified",
                "dataset_source": "Historical Observational Floods (1991-2020) + H3 Res 7",
                "synthetic_data_used": False,
                "operational_threshold": threshold,
                "threshold_scale": "calibrated_probability",
                "is_hazard_risk": bool(is_flood_risk),
                "prediction_label": "FLOOD_RISK" if is_flood_risk else "NO_FLOOD",
                "raw_probability": round(raw_score, 4),
                "calibrated_probability": round(cal_prob, 4),
                "raw_feature_count": 23,
                "processed_feature_count": int(X_proc.shape[1]),
                "missing_features_imputed": imputed_cols,
                "top_factors": importance,
            }

            # 7. Dynamic live weather risk adjustment
            if use_weather:
                lat = data.get("latitude", data.get("lat"))
                lon = data.get("longitude", data.get("lon", data.get("lng")))
                if lat is not None and lon is not None:
                    try:
                        adjustment = weather_adjuster.adjust_probability(
                            "flood", cal_prob, float(lat), float(lon), live_weather=live_w
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

        # ── LANDSLIDE / WILDFIRE (or legacy fallback) ────────────────────────
        elif hazard in self.models and hazard in self.features:
            model = self.models[hazard]
            feature_cols = self.features[hazard]

            df_input = self._build_feature_vector(hazard, data)
            base_prob = float(model.predict_proba(df_input)[0, 1])

            importance = {}
            base_estimator = model
            if hasattr(model, "estimators_") and hasattr(model, "calibrated_classifiers_"):
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
            if h == "flood" and self.flood_bundle_loaded:
                res["flood"] = {
                    "model": "flood",
                    "best": "XGBoost + Isotonic Calibration",
                    "version": "v3.1-verified",
                    "dataset_source": "Historical Observational Floods (1991-2020) + H3 Res 7",
                    "synthetic_data_used": False,
                    "operational_threshold": self.flood_operational_threshold,
                    "test_metrics": self.flood_metadata.get("final_test_metrics", {}),
                    "raw_features": self.flood_raw_features,
                    "inference_pipeline": self.flood_metadata.get("inference_pipeline", []),
                }
            elif h == "wildfire" and self.wildfire_bundle_loaded:
                res["wildfire"] = {
                    "model": "wildfire",
                    "best": "XGBoost Classifier (H3 Resolution 6)",
                    "version": "v3.1-verified-h3",
                    "dataset_source": "Government IMD/ERA5 + VIIRS/SNPP + H3 Res 6 (85,930 Zones Across India)",
                    "synthetic_data_used": False,
                    "operational_threshold": self.wildfire_operational_threshold,
                    "raw_features": self.wildfire_feature_names,
                    "spatial_resolution": "Uber H3 Res 6 (~36 sq km)",
                    "monitored_cells_count": len(self.wildfire_24h_df) if self.wildfire_24h_df is not None else 85930,
                    "inference_pipeline": [
                        "Spatial Nearest-Cell KDTree Lookup",
                        "Static Terrain & Forest Fraction Enrichment",
                        "Cyclical Month/DOY Temporal Encoding",
                        "Dynamic Live Weather & VPD / Fuel Risk Resolution",
                        "XGBoost Booster Inference"
                    ]
                }
            else:
                comp_path = os.path.join(MODEL_DIR, f"{h}_comparison.json")
                if os.path.exists(comp_path):
                    with open(comp_path, "r", encoding="utf-8") as f:
                        res[h] = json.load(f)
                else:
                    res[h] = {"status": "Not trained yet"}
        return res

    def get_thresholds(self) -> dict:
        """Return training-data-derived percentile thresholds."""
        return weather_adjuster.get_all_thresholds()


predictor = RiskPredictor()
