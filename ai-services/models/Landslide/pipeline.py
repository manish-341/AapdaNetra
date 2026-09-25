
import os
import sys


BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)


from predictor import LandslidePredictor
from weather import get_recent_rainfall
from srtm_service import get_terrain


# Load the trained model once when the service starts.
predictor = LandslidePredictor()


def aapdanetra_predict(
    latitude=None,
    longitude=None,
    elevation_m=None,
    slope_deg=None,
    rainfall_24h_mm=None,
    rainfall_3day_mm=None,
    rainfall_7day_mm=None,
    **kwargs
):
    """
    Complete AapdaNetra landslide-risk pipeline.

    Input:
        latitude, longitude (and/or optional custom elevation, slope, rainfall)

    Pipeline:
        Coordinates
            ↓
        SRTM terrain (or caller elevation/slope)
            ↓
        NASA POWER rainfall (or caller/accumulated rainfall)
            ↓
        XGBoost model
            ↓
        Landslide risk score
    """

    lat = float(latitude) if latitude is not None else None
    lon = float(longitude) if longitude is not None else None

    # --------------------------------------------------
    # 1. TERRAIN (SRTM / Caller-supplied)
    # --------------------------------------------------
    if elevation_m is not None and slope_deg is not None:
        terrain = {
            "srtm_elevation_m": float(elevation_m),
            "srtm_slope_deg": float(slope_deg),
            "terrain_source": "Caller/Provided"
        }
    elif lat is not None and lon is not None:
        terrain = get_terrain(latitude=lat, longitude=lon)
        if elevation_m is not None:
            terrain["srtm_elevation_m"] = float(elevation_m)
        if slope_deg is not None:
            terrain["srtm_slope_deg"] = float(slope_deg)
    else:
        raise ValueError("Must provide either (latitude, longitude) or (elevation_m, slope_deg).")

    # --------------------------------------------------
    # 2. RECENT RAINFALL (NASA POWER / Caller-supplied)
    # --------------------------------------------------
    if (rainfall_24h_mm is not None and 
        rainfall_3day_mm is not None and 
        rainfall_7day_mm is not None):
        rainfall = {
            "rainfall_24h_mm": float(rainfall_24h_mm),
            "rainfall_3day_mm": float(rainfall_3day_mm),
            "rainfall_7day_mm": float(rainfall_7day_mm),
            "rainfall_source": "Caller/Provided"
        }
    elif lat is not None and lon is not None:
        rainfall = get_recent_rainfall(latitude=lat, longitude=lon)
        if rainfall_24h_mm is not None:
            rainfall["rainfall_24h_mm"] = float(rainfall_24h_mm)
        if rainfall_3day_mm is not None:
            rainfall["rainfall_3day_mm"] = float(rainfall_3day_mm)
        if rainfall_7day_mm is not None:
            rainfall["rainfall_7day_mm"] = float(rainfall_7day_mm)
    else:
        # Fallback to defaults if neither coordinates nor rainfall provided
        rainfall = {
            "rainfall_24h_mm": float(rainfall_24h_mm or 0.0),
            "rainfall_3day_mm": float(rainfall_3day_mm or 0.0),
            "rainfall_7day_mm": float(rainfall_7day_mm or 0.0),
            "rainfall_source": "Default"
        }

    # --------------------------------------------------
    # 3. MODEL PREDICTION
    # --------------------------------------------------
    prediction = predictor.predict(
        elevation_m=terrain["srtm_elevation_m"],
        slope_deg=terrain["srtm_slope_deg"],
        rainfall_24h_mm=rainfall["rainfall_24h_mm"],
        rainfall_3day_mm=rainfall["rainfall_3day_mm"],
        rainfall_7day_mm=rainfall["rainfall_7day_mm"]
    )


    # --------------------------------------------------
    # 4. FINAL RESPONSE
    # --------------------------------------------------

    return {

        "location": {
            "latitude": latitude,
            "longitude": longitude
        },

        "terrain": terrain,

        "rainfall": rainfall,

        "prediction": prediction,

        "data_sources": {
            "terrain": "SRTM",
            "rainfall": "NASA POWER",
            "model": "AapdaNetra XGBoost"
        }
    }
