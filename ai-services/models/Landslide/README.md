
# AapdaNetra Landslide Prediction — Antigravity Integration

## PURPOSE

This package contains the trained AapdaNetra landslide ML service.

DO NOT retrain the model during integration.

The production flow is:

Latitude + Longitude
        ↓
SRTM terrain
        ↓
Elevation + slope
        ↓
NASA POWER rainfall
        ↓
24h / 3-day / 7-day rainfall
        ↓
AapdaNetra XGBoost model
        ↓
Landslide risk score
        ↓
NORMAL / WATCH / ALERT


## API

### Health

GET:

/health


Example response:

{
  "status": "ok",
  "service": "AapdaNetra Landslide Prediction API"
}


### Prediction

POST:

/predict


Request:

{
  "latitude": 26.8826,
  "longitude": 88.2788
}


The API automatically obtains:

- SRTM elevation
- SRTM-derived slope
- NASA POWER recent rainfall
- 24-hour rainfall
- 3-day rainfall
- 7-day rainfall

and passes the five required features to the trained XGBoost model.


## MODEL FEATURES

The trained model expects exactly:

1. srtm_elevation_m
2. srtm_slope_deg
3. rainfall_24h_mm
4. rainfall_3day_mm
5. rainfall_7day_mm


## RISK LEVELS

Current operational thresholds:

risk_score < 0.35
    NORMAL

0.35 <= risk_score < 0.50
    WATCH

risk_score >= 0.50
    ALERT


IMPORTANT:

The XGBoost output is treated as a RISK SCORE.

It is NOT a calibrated real-world probability.

calibrated_probability is therefore false.


## RUNNING THE SERVICE

Create a Python environment:

python -m venv .venv


Windows:

.venv\Scripts\activate


Linux/macOS:

source .venv/bin/activate


Install dependencies:

pip install -r requirements.txt


Start API:

uvicorn main:app --host 0.0.0.0 --port 8000


Swagger documentation:

http://localhost:8000/docs


## AAPDANETRA NODE.JS INTEGRATION

The existing Node/Express backend should call:

POST http://<ML-SERVICE-HOST>:8000/predict


Request:

{
  "latitude": 26.8826,
  "longitude": 88.2788
}


The React frontend should NOT load the XGBoost model directly.

Recommended architecture:

React
  ↓
Node/Express backend
  ↓
Python FastAPI ML service
  ↓
SRTM + NASA POWER + XGBoost


## END-TO-END TEST

Previously tested location:

Latitude:
26.8826

Longitude:
88.2788


Tested result:

Elevation:
1545.05 m

Slope:
19.556353 degrees

24-hour rainfall:
22.54 mm

3-day rainfall:
36.04 mm

7-day rainfall:
99.46 mm

Risk score:
0.7541

Risk level:
ALERT

calibrated_probability:
false


## VALIDATION

Spatial validation:

Accuracy:
0.7393

Precision:
0.6997

Recall:
0.8384

F1:
0.7628

ROC-AUC:
0.8073


Temporal validation:

Accuracy:
0.6846

Precision:
0.6516

Recall:
0.7950

F1:
0.7162

ROC-AUC:
0.7634


These are historical validation measurements.
They are not guarantees of future field performance.


## IMPORTANT SRTM COVERAGE

This package currently includes:

N26E088
N27E094
N31E077
N33E074


Therefore the terrain component currently works only where
the required SRTM tile is present.

For nationwide arbitrary-coordinate deployment,
additional SRTM tiles or a production terrain-data service
must be added.


## FILE STRUCTURE

main.py
    FastAPI entry point

pipeline.py
    Complete prediction orchestration

predictor.py
    XGBoost inference

weather.py
    NASA POWER rainfall retrieval

srtm_service.py
    SRTM elevation and slope

model/
    Trained XGBoost model and configuration

data/
    Training/validation datasets

srtm/
    Terrain tiles

requirements.txt
    Python dependencies


## INTEGRATION INSTRUCTION FOR ANTIGRAVITY

Integrate this package as the dedicated Python landslide
prediction microservice for AapdaNetra.

Do not retrain the model.

Do not replace the five model features.

Do not use flood_occurred as the target.

Do not use the synthetic Landslide Probability field
as the target.

The API input should remain:

latitude + longitude

The backend should call /predict and return the resulting
risk score and risk level to the React dashboard/map.

The ML service should remain separate from the React frontend.
