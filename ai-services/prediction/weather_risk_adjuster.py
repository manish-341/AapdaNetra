"""
AapdaNetra — Threshold-Exceedance-Based Dynamic Risk Adjuster
Fetches live weather from OpenWeather API (production provider) and computes
exceedance ratios against training-data-derived percentile thresholds.

The adjusted probability formula:
    adjusted_prob = base_ml_prob × (1.0 + α × exceedance_ratio)
    clamped to [0.01, 0.99]

Where:
    - base_ml_prob = raw output from the trained XGBoost / RF model
    - exceedance_ratio = how far the live weather exceeds the P90 threshold
      from the real government training data (IMD / CWC / GSI)
    - α = hazard-specific sensitivity coefficient

This approach is scientifically defensible because the thresholds are derived
from the actual training distribution (real IMD/CWC data) and the live weather
provides a real-time calibration signal.
"""
import os
import json
import urllib.request
import urllib.error
from datetime import datetime, timezone
from functools import lru_cache
from dotenv import load_dotenv

load_dotenv()


MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models")

# Hazard-specific sensitivity coefficients (α)
# Determines how aggressively live weather shifts the ML probability
ALPHA = {
    "flood": 0.45,      # Rainfall exceedance is very predictive of flash floods
    "landslide": 0.35,   # Rainfall + soil saturation are key triggers
    "wildfire": 0.40,    # Heat-dryness combination is a strong fire signal
}

# Mapping: which live weather variables drive which hazard
HAZARD_WEATHER_DRIVERS = {
    "flood": {
        "primary": ["annual_rainfall_mm", "monsoon_rainfall_mm", "max_daily_rainfall_mm"],
        "secondary": ["topographic_wetness_index"],
    },
    "landslide": {
        "primary": ["annual_rainfall_mm", "monsoon_rainfall_mm", "max_daily_rainfall_mm"],
        "secondary": ["slope_instability_index"],
    },
    "wildfire": {
        "primary": ["mean_temperature_c", "fuel_aridity_index"],
        "secondary": ["annual_rainfall_mm"],  # inverse — low rainfall → higher fire risk
    },
}


class WeatherRiskAdjuster:
    """
    Fetches live weather and adjusts ML risk probabilities using
    threshold-exceedance ratios derived from the training data distribution.
    """

    def __init__(self):
        self.thresholds = {}
        self._load_thresholds()

    def _load_thresholds(self):
        """Load percentile thresholds computed during model training."""
        for hazard in ["flood", "landslide", "wildfire"]:
            wf_bundle_path = os.path.join(MODEL_DIR, "Wildfire", "wildfire_thresholds.json")
            std_path = os.path.join(MODEL_DIR, f"{hazard}_thresholds.json")
            path = wf_bundle_path if (hazard == "wildfire" and os.path.exists(wf_bundle_path)) else std_path
            if os.path.exists(path):
                try:
                    with open(path, "r") as f:
                        self.thresholds[hazard] = json.load(f)
                except Exception as e:
                    print(f"[WeatherRiskAdjuster] Failed to load {hazard} thresholds: {e}")

    def reload_thresholds(self):
        """Reload thresholds (call after retraining)."""
        self.thresholds = {}
        self._load_thresholds()

    def fetch_live_weather(self, lat: float, lon: float) -> dict:
        """
        Fetch current weather from OpenWeather API (production provider).
        Returns a standardized weather dict mapped to our training feature names.

        Antecedent rainfall (rainfall_Nd_pre) is NOT computed here — it comes
        from the MongoDB accumulator via the backend. This method only provides
        the current instantaneous weather snapshot for exceedance calculations.
        """
        api_key = os.environ.get("OPENWEATHER_API_KEY", "")
        if api_key and api_key != "your_openweather_api_key_here":
            try:
                url = (
                    f"https://api.openweathermap.org/data/2.5/weather?"
                    f"lat={lat}&lon={lon}&appid={api_key}&units=metric"
                )
                req = urllib.request.Request(url, headers={"User-Agent": "AapdaNetra/3.1"})
                with urllib.request.urlopen(req, timeout=8) as resp:
                    data = json.loads(resp.read().decode())

                temp = data.get("main", {}).get("temp", 28)
                humidity = data.get("main", {}).get("humidity", 65)
                wind = data.get("wind", {}).get("speed", 8)
                pressure = data.get("main", {}).get("pressure", 1013)
                precip_1h = data.get("rain", {}).get("1h", 0) or 0

                return {
                    "temperature_2m": temp,
                    "humidity_pct": humidity,
                    "wind_speed_ms": wind,
                    "precipitation_now_mm": precip_1h,
                    "daily_precipitation_mm": precip_1h,
                    "pressure_hpa": pressure,
                    "max_daily_rainfall_mm": precip_1h * 24,
                    "annual_rainfall_mm": precip_1h * 24 * 365 * 0.3,
                    "monsoon_rainfall_mm": precip_1h * 24 * 120 * 0.4,
                    "mean_temperature_c": temp,
                    "fuel_aridity_index": max(0, (temp / 3.5) - (humidity / 15)),
                    "source": "OpenWeather",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "status": "live",
                    "lat": lat,
                    "lon": lon,
                }
            except Exception as e:
                print(f"[WeatherRiskAdjuster] OpenWeather fetch failed: {e}")

        # 2. Free live fallback: Open-Meteo (Real-time telemetry, no API key required)
        open_meteo = self._fetch_open_meteo(lat, lon)
        if open_meteo:
            return open_meteo

        # 3. Static fallback if network unreachable
        return self._default_weather(lat, lon)

    def _fetch_open_meteo(self, lat: float, lon: float) -> dict:
        """Fetch live real-time meteorological telemetry from Open-Meteo API."""
        try:
            url = (
                f"https://api.open-meteo.com/v1/forecast?"
                f"latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,"
                f"precipitation,rain,surface_pressure,wind_speed_10m&timezone=auto"
            )
            req = urllib.request.Request(url, headers={"User-Agent": "AapdaNetra/3.1"})
            with urllib.request.urlopen(req, timeout=8) as resp:
                data = json.loads(resp.read().decode())

            curr = data.get("current", {})
            temp = float(curr.get("temperature_2m", 28.0))
            humidity = float(curr.get("relative_humidity_2m", 65.0))
            wind = float(curr.get("wind_speed_10m", 8.0))
            pressure = float(curr.get("surface_pressure", 1013.0))
            precip = float(curr.get("precipitation", curr.get("rain", 0.0)) or 0.0)

            return {
                "temperature_2m": temp,
                "humidity_pct": humidity,
                "wind_speed_ms": wind / 3.6,  # km/h to m/s
                "precipitation_now_mm": precip,
                "daily_precipitation_mm": precip,
                "pressure_hpa": pressure,
                "max_daily_rainfall_mm": precip * 24,
                "annual_rainfall_mm": precip * 24 * 365 * 0.3,
                "monsoon_rainfall_mm": precip * 24 * 120 * 0.4,
                "mean_temperature_c": temp,
                "fuel_aridity_index": max(0, (temp / 3.5) - (humidity / 15)),
                "source": "Open-Meteo",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "status": "live",
                "lat": lat,
                "lon": lon,
            }
        except Exception as err:
            print(f"[WeatherRiskAdjuster] Open-Meteo live telemetry fetch failed: {err}")
            return None

    def _default_weather(self, lat: float, lon: float) -> dict:
        """Fallback weather when API is unreachable."""
        return {
            "temperature_2m": 30, "humidity_pct": 65, "wind_speed_ms": 8,
            "precipitation_now_mm": 5, "daily_precipitation_mm": 10,
            "max_daily_rainfall_mm": 15, "annual_rainfall_mm": 1100,
            "monsoon_rainfall_mm": 800, "mean_temperature_c": 30,
            "fuel_aridity_index": 6.5,
            "source": "calibrated_baseline", "status": "fallback",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "lat": lat, "lon": lon,
        }

    def compute_exceedance(self, hazard: str, live_weather: dict) -> dict:
        """
        Compute exceedance ratios for the given hazard type.

        Returns a dict with:
          - exceedance_ratio: aggregate exceedance (0.0 = at threshold, >0 = above)
          - per_variable: individual exceedance per weather driver
          - percentile_position: where the live value falls in the training distribution
        """
        if hazard not in self.thresholds:
            return {"exceedance_ratio": 0.0, "per_variable": {}, "percentile_position": {}}

        hazard_thresholds = self.thresholds[hazard]
        drivers = HAZARD_WEATHER_DRIVERS.get(hazard, {})
        primary_vars = drivers.get("primary", [])
        secondary_vars = drivers.get("secondary", [])

        per_var = {}
        percentile_pos = {}
        exceedances = []

        for var in primary_vars + secondary_vars:
            if var not in hazard_thresholds:
                continue

            var_th = hazard_thresholds[var]
            live_val = live_weather.get(var)
            if live_val is None:
                continue

            p90 = var_th.get("p90", 0)
            p50 = var_th.get("p50", 0)
            p10 = var_th.get("p10", 0)
            mean = var_th.get("mean", 0)
            std = var_th.get("std", 1)

            # For wildfire rainfall — inverse relationship (low rain → high risk)
            if hazard == "wildfire" and "rainfall" in var:
                # Exceedance when rainfall is BELOW p10
                if p10 > 0 and live_val < p10:
                    exc = (p10 - live_val) / max(p10, 1)
                else:
                    exc = 0.0
            else:
                # Standard exceedance: how far above P90
                if p90 > 0 and live_val > p90:
                    exc = (live_val - p90) / max(p90, 1)
                else:
                    exc = 0.0

            # Compute approximate percentile position
            if std > 0:
                z_score = (live_val - mean) / std
                # Rough percentile from z-score
                pct = min(99, max(1, int(50 + z_score * 20)))
            else:
                pct = 50

            weight = 1.0 if var in primary_vars else 0.5
            per_var[var] = {
                "live_value": round(live_val, 2),
                "p90_threshold": round(p90, 2),
                "p50_median": round(p50, 2),
                "exceedance": round(exc, 4),
                "weight": weight,
            }
            percentile_pos[var] = pct
            exceedances.append(exc * weight)

        # Aggregate exceedance ratio (weighted average)
        if exceedances:
            total_weight = sum(1.0 if v in primary_vars else 0.5
                              for v in per_var.keys())
            agg_exc = sum(exceedances) / max(total_weight, 1)
        else:
            agg_exc = 0.0

        return {
            "exceedance_ratio": round(agg_exc, 4),
            "per_variable": per_var,
            "percentile_position": percentile_pos,
        }

    def adjust_probability(self, hazard: str, base_prob: float,
                           lat: float, lon: float,
                           live_weather: dict = None) -> dict:
        """
        Core method: adjust the base ML probability using live weather exceedance.

        Args:
            hazard: "flood", "landslide", or "wildfire"
            base_prob: raw probability from the ML model (0.0 to 1.0)
            lat, lon: coordinates for weather fetch
            live_weather: optional pre-fetched weather dict

        Returns:
            dict with adjusted_probability, weather data, and correlation metadata
        """
        # Fetch live weather if not provided
        if live_weather is None:
            live_weather = self.fetch_live_weather(lat, lon)

        # Compute exceedance
        exceedance = self.compute_exceedance(hazard, live_weather)
        alpha = ALPHA.get(hazard, 0.35)

        # Apply dynamic adjustment
        exc_ratio = exceedance["exceedance_ratio"]
        multiplier = 1.0 + (alpha * exc_ratio)

        # Also apply a mild dampening if conditions are well below thresholds
        # (e.g., no rain during flood check → reduce probability slightly)
        if exc_ratio == 0.0:
            # Check if conditions are significantly below median
            below_median_count = sum(
                1 for v_data in exceedance["per_variable"].values()
                if v_data["live_value"] < v_data["p50_median"] * 0.5
            )
            if below_median_count > 0:
                dampening = 0.85 ** below_median_count
                multiplier *= dampening

        adjusted_prob = min(0.99, max(0.01, base_prob * multiplier))

        return {
            "base_probability": round(base_prob, 4),
            "adjusted_probability": round(adjusted_prob, 4),
            "adjustment_multiplier": round(multiplier, 4),
            "exceedance_ratio": exc_ratio,
            "alpha_coefficient": alpha,
            "weather_correlation": {
                "per_variable": exceedance["per_variable"],
                "percentile_position": exceedance["percentile_position"],
                "interpretation": self._interpret_exceedance(hazard, exc_ratio),
            },
            "live_weather": {
                "temperature": live_weather.get("temperature_2m"),
                "humidity": live_weather.get("humidity_pct"),
                "precipitation": live_weather.get("precipitation_now_mm"),
                "daily_precipitation": live_weather.get("daily_precipitation_mm"),
                "wind_speed": live_weather.get("wind_speed_ms"),
                "source": live_weather.get("source"),
                "status": live_weather.get("status"),
                "timestamp": live_weather.get("timestamp"),
            },
        }

    def _interpret_exceedance(self, hazard: str, exc_ratio: float) -> str:
        """Human-readable interpretation of the exceedance ratio."""
        if exc_ratio >= 0.5:
            return (f"⚠️ CRITICAL: Current conditions significantly exceed the 90th percentile "
                    f"of {hazard} risk factors from IMD/CWC/GSI training data. "
                    f"Dynamic risk is elevated by {exc_ratio*100:.0f}%.")
        elif exc_ratio >= 0.2:
            return (f"🟡 ELEVATED: Current weather exceeds typical {hazard} thresholds "
                    f"from the training distribution. Risk adjusted upward.")
        elif exc_ratio > 0:
            return (f"🟢 MARGINAL: Current conditions slightly above typical {hazard} "
                    f"thresholds. Mild risk adjustment applied.")
        else:
            return (f"✅ NORMAL: Current conditions within or below historical {hazard} "
                    f"baselines from government training data. No upward adjustment.")

    def get_all_thresholds(self) -> dict:
        """Return all loaded thresholds (for the /models/thresholds endpoint)."""
        return self.thresholds


# Singleton instance
weather_adjuster = WeatherRiskAdjuster()
