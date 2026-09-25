"""
AapdaNetra AI Disaster Intelligence Service (v3)
FastAPI entry point for ML risk predictions with live weather dynamic adjustment,
time-series forecasting, vision analysis, and NLP report classification.

Models trained on: IMD Pune, CWC Telemetry, GSI Landslide Atlas, NDMA, Copernicus DEM, Sentinel-2
"""
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os
from dotenv import load_dotenv

load_dotenv()

from prediction.predict import predictor
from forecasting.time_series import forecast_time_series
from vision.disaster_detection import analyze_disaster_image
from nlp.report_classifier import classify_citizen_text

app = FastAPI(
    title="AapdaNetra AI Disaster Intelligence API",
    version="3.0.0",
    description=(
        "Multi-hazard risk prediction microservice trained on real Indian government data "
        "(IMD, CWC, GSI, NDMA). Supports XGBoost/RandomForest classification with "
        "probability calibration and live weather dynamic risk adjustment via "
        "threshold-exceedance correlation against OpenWeather telemetry."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request Models ───────────────────────────────────────────────────────────

class RiskPredictionRequest(BaseModel):
    latitude: float
    longitude: float
    temperature: Optional[float] = 30.0
    humidity: Optional[float] = 65.0
    rainfall: Optional[float] = None
    wind_speed: Optional[float] = 10.0
    pressure: Optional[float] = 1013.0
    slope_angle_deg: Optional[float] = None
    elevation_m: Optional[float] = None
    annual_rainfall_mm: Optional[float] = None
    earthquake_frequency: Optional[float] = None
    erosion_index: Optional[float] = None
    mining_activity: Optional[str] = "No"

    slope_deg: Optional[float] = None
    curvature: Optional[float] = None
    ndvi: Optional[float] = None
    monsoon_rainfall_mm: Optional[float] = None
    max_daily_rainfall_mm: Optional[float] = None
    dist_to_river_km: Optional[float] = None
    dist_to_road_km: Optional[float] = None
    soil_moisture_pct: Optional[float] = None
    mean_temperature_c: Optional[float] = None

    # Antecedent cumulative rainfall features from OpenWeather accumulator
    rainfall_1d_pre: Optional[float] = None
    rainfall_3d_pre: Optional[float] = None
    rainfall_5d_pre: Optional[float] = None
    rainfall_7d_pre: Optional[float] = None
    rainfall_10d_pre: Optional[float] = None

    # Flood raw features
    drainage_area: Optional[float] = None
    catchment_relief: Optional[float] = None
    annual_mean_temperature: Optional[float] = None
    annual_precipitation: Optional[float] = None
    population_density: Optional[float] = None
    land_cover: Optional[str] = None
    soil_type: Optional[str] = None
    lithology_type: Optional[str] = None
    historical_flood_count: Optional[float] = None
    days_since_previous_flood: Optional[float] = None
    flood_count_1y_prior: Optional[float] = None
    flood_count_3y_prior: Optional[float] = None
    flood_count_5y_prior: Optional[float] = None
    no_previous_flood: Optional[float] = None
    monsoon_season: Optional[str] = None

    # Wildfire H3 & fuel indices
    h3_cell_id: Optional[str] = None
    forest_fraction: Optional[float] = None
    fuel_drying_index: Optional[float] = None
    fuel_combustion_risk: Optional[float] = None
    vpd_kpa: Optional[float] = None

    class Config:
        extra = "allow"


class ForecastRequest(BaseModel):
    indicator: str
    current_value: float
    horizon_hours: Optional[List[int]] = [0, 2, 6, 12, 24]


class ClassifyReportRequest(BaseModel):
    text: str


class SimulationRequest(BaseModel):
    scenario: str
    adjustment_percent: float
    latitude: Optional[float] = 28.6139
    longitude: Optional[float] = 77.209


# ── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "AapdaNetra AI Intelligence Engine",
        "version": "3.0.0",
        "data_provenance": "Real Indian Government Data (IMD, CWC, GSI, NDMA)",
        "features": [
            "ML Risk Prediction (XGBoost + Calibrated Probabilities)",
            "Live Weather Dynamic Risk Adjustment (Open-Meteo)",
            "Threshold-Exceedance Correlation Analysis",
            "Time-Series Forecasting (GRU Temporal)",
            "Vision-Based Disaster Detection",
            "NLP Citizen Report Classification",
        ],
    }


@app.get("/health")
def health_check():
    return {"status": "healthy", "version": "3.0.0"}


# ── Standard ML Predictions (no weather adjustment) ─────────────────────────

@app.post("/predict/flood")
def predict_flood(req: RiskPredictionRequest):
    return predictor.predict_hazard("flood", req.dict())


@app.post("/predict/landslide")
@app.post("/predict")
def predict_landslide(req: RiskPredictionRequest):
    return predictor.predict_hazard("landslide", req.dict())


@app.post("/predict/wildfire")
def predict_wildfire(req: RiskPredictionRequest):
    return predictor.predict_hazard("wildfire", req.dict())


@app.get("/predict/wildfire/24h")
def get_wildfire_24h(
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    h3_cell_id: Optional[str] = None
):
    """Fast-track 24-hour wildfire prediction lookup from in-memory precomputed H3 grid."""
    actual_lat = lat if lat is not None else latitude
    actual_lon = lon if lon is not None else longitude
    return predictor.get_wildfire_24h_prediction(lat=actual_lat, lon=actual_lon, h3_cell_id=h3_cell_id)


@app.post("/predict/wildfire/24h")
def post_wildfire_24h(req: RiskPredictionRequest):
    """POST endpoint for fast-track 24-hour wildfire prediction lookup."""
    return predictor.get_wildfire_24h_prediction(lat=req.latitude, lon=req.longitude, h3_cell_id=req.h3_cell_id)


@app.get("/predict/wildfire/24h-grid")
def get_wildfire_24h_grid(
    state: Optional[str] = None,
    min_risk: Optional[str] = None,
    min_lon: Optional[float] = None,
    min_lat: Optional[float] = None,
    max_lon: Optional[float] = None,
    max_lat: Optional[float] = None,
    limit: int = 500
):
    """Returns high-risk wildfire H3 cells with polygons for frontend GIS map overlays."""
    bbox = None
    if all(v is not None for v in [min_lon, min_lat, max_lon, max_lat]):
        bbox = (min_lon, min_lat, max_lon, max_lat)
    return predictor.get_wildfire_24h_grid(state=state, min_risk=min_risk, bbox=bbox, limit=limit)


@app.post("/predict/unified")
def predict_unified(req: RiskPredictionRequest):
    return predictor.predict_unified(req.dict())


# ── Real-Time Predictions (with live weather dynamic adjustment) ─────────────

@app.post("/predict/realtime")
def predict_realtime(req: RiskPredictionRequest):
    """
    Multi-hazard prediction with live weather dynamic risk adjustment.
    Fetches current weather from OpenWeather and applies threshold-exceedance
    correlation against IMD/CWC/GSI training data percentiles.

    Response includes:
    - base_probability: raw ML model output
    - probability: adjusted using live weather exceedance
    - weather_correlation: per-variable exceedance ratios and percentile positions
    - live_weather: current OpenWeather telemetry
    """
    return predictor.predict_unified_realtime(req.dict())


@app.post("/predict/realtime/{hazard_type}")
def predict_realtime_single(hazard_type: str, req: RiskPredictionRequest):
    """Real-time single-hazard prediction with weather adjustment."""
    hazard = hazard_type.lower()
    if hazard not in ["flood", "landslide", "wildfire"]:
        raise HTTPException(status_code=400, detail=f"Invalid hazard type: {hazard_type}")
    return predictor.predict_realtime(hazard, req.dict())


# ── Model Metadata ───────────────────────────────────────────────────────────

@app.get("/models/comparison")
def get_model_comparison():
    """Returns training metrics, dataset provenance, and benchmark results."""
    return predictor.get_comparison_metrics()


@app.get("/models/thresholds")
def get_model_thresholds():
    """
    Returns percentile thresholds derived from the real government training data.
    These are the baselines used by the dynamic risk adjuster to compute
    exceedance ratios against live weather.
    """
    return predictor.get_thresholds()


# ── Forecasting, Vision, NLP ────────────────────────────────────────────────

@app.post("/forecast")
def forecast(req: ForecastRequest):
    return forecast_time_series(req.indicator, req.current_value, req.horizon_hours)


@app.post("/classify/report")
def classify_report(req: ClassifyReportRequest):
    return classify_citizen_text(req.text)


@app.post("/vision/analyze")
async def analyze_image(file: UploadFile = File(...)):
    contents = await file.read()
    return analyze_disaster_image(contents)


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("AI_SERVICE_PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
