
import requests
import pandas as pd
import numpy as np


NASA_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"


def _fetch_open_meteo_rainfall(latitude, longitude):
    """
    Fallback to Open-Meteo past 7-day precipitation when NASA POWER is slow or unavailable.
    """
    try:
        url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "past_days": 7,
            "forecast_days": 1,
            "daily": "precipitation_sum",
            "timezone": "auto"
        }
        res = requests.get(url, params=params, timeout=4)
        if res.status_code == 200:
            daily = res.json().get("daily", {})
            precip = daily.get("precipitation_sum", [])
            dates = daily.get("time", [])
            if len(precip) >= 7:
                p7 = [float(x) if x is not None else 0.0 for x in precip[-7:]]
                return {
                    "rainfall_24h_mm": round(p7[-1], 2),
                    "rainfall_3day_mm": round(float(sum(p7[-3:])), 2),
                    "rainfall_7day_mm": round(float(sum(p7)), 2),
                    "rainfall_window_start": dates[-7] if len(dates) >= 7 else "recent",
                    "rainfall_window_end": dates[-1] if len(dates) >= 7 else "today",
                    "rainfall_valid_days": 7,
                    "rainfall_source": "Open-Meteo Precipitation (NASA Fallback)"
                }
    except Exception:
        pass
    return None


def get_recent_rainfall(
    latitude,
    longitude,
    days=7,
    lookback_days=21
):
    """
    Fetch recent daily precipitation from NASA POWER.
    Falls back to Open-Meteo past 7-day precipitation if NASA POWER
    is slow, offline, or lacks consecutive valid days.

    Returns:
        rainfall_24h_mm
        rainfall_3day_mm
        rainfall_7day_mm
        rainfall_window_start
        rainfall_window_end
        rainfall_valid_days
    """

    latitude = float(latitude)
    longitude = float(longitude)

    if not (-90 <= latitude <= 90):
        raise ValueError("Latitude must be between -90 and 90.")

    if not (-180 <= longitude <= 180):
        raise ValueError("Longitude must be between -180 and 180.")

    if days != 7:
        raise ValueError("This model currently requires a 7-day rainfall window.")

    end_date = pd.Timestamp.now(tz="UTC").normalize()

    start_date = (
        end_date -
        pd.Timedelta(days=lookback_days - 1)
    )

    params = {
        "parameters": "PRECTOTCORR",
        "community": "AG",
        "longitude": longitude,
        "latitude": latitude,
        "start": start_date.strftime("%Y%m%d"),
        "end": end_date.strftime("%Y%m%d"),
        "format": "JSON"
    }

    try:
        response = requests.get(
            NASA_URL,
            params=params,
            timeout=5
        )
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        # Seamlessly fallback to Open-Meteo
        om_rain = _fetch_open_meteo_rainfall(latitude, longitude)
        if om_rain is not None:
            return om_rain
        raise ValueError(f"NASA POWER unavailable ({e}) and rainfall fallback failed.")

    rainfall = (
        data["properties"]
        ["parameter"]
        ["PRECTOTCORR"]
    )

    rows = []

    for date_str, value in rainfall.items():

        value = float(value)

        if value == -999:
            value = np.nan

        rows.append({
            "date": pd.to_datetime(date_str),
            "rainfall_mm": value
        })

    rain_df = (
        pd.DataFrame(rows)
        .sort_values("date")
        .reset_index(drop=True)
    )

    valid_mask = rain_df["rainfall_mm"].notna()

    valid_count = 0
    selected = None

    # Find the most recent contiguous 7 valid days.
    for end_idx in range(len(rain_df) - 1, -1, -1):

        if not valid_mask.iloc[end_idx]:
            valid_count = 0
            continue

        valid_count += 1

        if valid_count == days:

            start_idx = end_idx - days + 1

            selected = rain_df.iloc[
                start_idx:end_idx + 1
            ].copy()

            break

    if selected is None:
        om_rain = _fetch_open_meteo_rainfall(latitude, longitude)
        if om_rain is not None:
            return om_rain
        raise ValueError(
            "NASA POWER does not currently provide "
            "7 consecutive valid rainfall days "
            "for this location, and fallback failed."
        )

    rainfall_values = (
        selected["rainfall_mm"]
        .to_numpy(dtype=float)
    )

    return {
        "rainfall_24h_mm": float(
            rainfall_values[-1]
        ),

        "rainfall_3day_mm": float(
            rainfall_values[-3:].sum()
        ),

        "rainfall_7day_mm": float(
            rainfall_values.sum()
        ),

        "rainfall_window_start": (
            selected["date"]
            .iloc[0]
            .strftime("%Y-%m-%d")
        ),

        "rainfall_window_end": (
            selected["date"]
            .iloc[-1]
            .strftime("%Y-%m-%d")
        ),

        "rainfall_valid_days": int(
            len(selected)
        )
    }
