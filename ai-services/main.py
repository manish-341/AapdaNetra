"""
AapdaNetra AI Disaster Intelligence Service
FastAPI entry point for ML risk predictions, time-series forecasting, vision analysis, and NLP.
"""
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os

from prediction.predict import predictor
from forecasting.time_series import forecast_time_series
from vision.disaster_detection import analyze_disaster_image
from nlp.report_classifier import classify_citizen_text

app = FastAPI(
    title="AapdaNetra AI Disaster Intelligence API",
    version="2.0.0",
    description="Microservice providing XGBoost risk predictions, GRU time-series forecasting, YOLO vision, and NLP report classification."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RiskPredictionRequest(BaseModel):
    latitude: float
    longitude: float
    temperature: Optional[float] = 30.0
    humidity: Optional[float] = 65.0
    rainfall: Optional[float] = 10.0
    wind_speed: Optional[float] = 10.0
    pressure: Optional[float] = 1013.0
    slope_angle_deg: Optional[float] = 15.0
    elevation_m: Optional[float] = 150.0

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

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "AapdaNetra AI Intelligence Engine",
        "version": "2.0.0"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/predict/flood")
def predict_flood(req: RiskPredictionRequest):
    return predictor.predict_hazard("flood", req.dict())

@app.post("/predict/landslide")
def predict_landslide(req: RiskPredictionRequest):
    return predictor.predict_hazard("landslide", req.dict())

@app.post("/predict/wildfire")
def predict_wildfire(req: RiskPredictionRequest):
    return predictor.predict_hazard("wildfire", req.dict())

@app.post("/predict/unified")
def predict_unified(req: RiskPredictionRequest):
    return predictor.predict_unified(req.dict())

@app.get("/models/comparison")
def get_model_comparison():
    return predictor.get_comparison_metrics()

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
