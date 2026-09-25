
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from pipeline import aapdanetra_predict


app = FastAPI(
    title="AapdaNetra Landslide Prediction API",
    description=(
        "Real-time landslide risk scoring using "
        "SRTM terrain, NASA POWER rainfall and "
        "the trained AapdaNetra XGBoost model."
    ),
    version="1.0.0"
)


class PredictionRequest(BaseModel):

    latitude: float = Field(
        ...,
        ge=-90,
        le=90
    )

    longitude: float = Field(
        ...,
        ge=-180,
        le=180
    )


@app.get("/health")
def health():

    return {
        "status": "ok",
        "service": "AapdaNetra Landslide Prediction API"
    }


@app.post("/predict")
def predict(
    request: PredictionRequest
):

    try:

        result = aapdanetra_predict(
            latitude=request.latitude,
            longitude=request.longitude
        )

        return result

    except FileNotFoundError as e:

        raise HTTPException(
            status_code=503,
            detail=str(e)
        )

    except ValueError as e:

        raise HTTPException(
            status_code=503,
            detail=str(e)
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=(
                "Landslide prediction failed: "
                + str(e)
            )
        )
