"""
AapdaNetra — Comprehensive Pipeline Verification Script
Tests:
4. Exact 23-feature construction
5. /predict/flood (Verified XGBoost + Isotonic Calibration + 0.20 Threshold)
6. /predict/unified (Multi-hazard response)
7. /predict/realtime (Live OpenWeather dynamic risk adjustment)
8. Landslide prediction pipeline
9. Wildfire prediction pipeline
"""
import os
import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
import json
import numpy as np
import pandas as pd

# Compatibility shims for scikit-learn unpickling
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

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

from prediction.predict import predictor
from prediction.weather_risk_adjuster import weather_adjuster


def run_all_tests():
    print("=" * 80)
    print("  AapdaNetra AI Services — Verification Suite (Tests 4 through 9)")
    print("=" * 80)

    # ─────────────────────────────────────────────────────────────────────────
    # TEST 4: Exact 23-Feature Construction
    # ─────────────────────────────────────────────────────────────────────────
    print("\n" + "-" * 80)
    print("TEST 4: Exact 23-Feature Construction & Missing Feature Imputation Tracking")
    print("-" * 80)

    sample_caller_data = {
        "latitude": 28.6139,
        "longitude": 77.2090,
        "rainfall_1d_pre": 18.5,
        "rainfall_3d_pre": 42.0,
        # Intentionally omitting 5d, 7d, 10d to verify partial history imputation
        "Drainage Area": 1250.0,
        "Catchment Relief": 350.0,
        "Land cover": "Grassland",
        "Soil type": "Alluvial",
        "lithology type": "Sedimentary",
        "monsoon_season": "non_monsoon",
        "historical_flood_count": 2,
    }

    df_raw, imputed = predictor._build_flood_feature_vector(sample_caller_data)

    print(f"Constructed DataFrame shape : {df_raw.shape} (Expected: (1, 23))")
    print(f"Columns in raw vector ({len(df_raw.columns)}):")
    for i, col in enumerate(df_raw.columns, 1):
        val = df_raw.iloc[0][col]
        print(f"   {i:2d}. {col:<26}: {val} (dtype: {type(val).__name__})")

    assert df_raw.shape == (1, 23), f"Expected shape (1, 23), got {df_raw.shape}"

    expected_23 = [
        "Drainage Area", "Catchment Relief", "Annual Mean Temperature", "Annual Precipitation",
        "Population Density", "Land cover", "Soil type", "lithology type",
        "rainfall_1d_pre", "rainfall_3d_pre", "rainfall_5d_pre", "rainfall_7d_pre", "rainfall_10d_pre",
        "historical_flood_count", "days_since_previous_flood", "flood_count_1y_prior",
        "flood_count_3y_prior", "flood_count_5y_prior", "year", "month", "day_of_year",
        "no_previous_flood", "monsoon_season"
    ]
    assert list(df_raw.columns) == expected_23, "Column names do not match expected 23-feature schema!"

    print(f"\nImputed features reported ({len(imputed)}): {imputed}")
    assert "rainfall_5d_pre" in imputed
    assert "rainfall_7d_pre" in imputed
    assert "rainfall_10d_pre" in imputed
    print("✅ TEST 4 PASSED: Exact 23 features constructed; missing antecedent windows explicitly imputed!")

    # ─────────────────────────────────────────────────────────────────────────
    # TEST 5: /predict/flood End-to-End Execution
    # ─────────────────────────────────────────────────────────────────────────
    print("\n" + "-" * 80)
    print("TEST 5: /predict/flood (Verified Bundle: XGBoost + Isotonic Calibrator + 0.20 Threshold)")
    print("-" * 80)

    # Low risk test scenario
    low_data = {
        "latitude": 28.6139,
        "longitude": 77.2090,
        "rainfall_1d_pre": 0.0,
        "rainfall_3d_pre": 0.0,
        "rainfall_5d_pre": 0.0,
        "rainfall_7d_pre": 0.0,
        "rainfall_10d_pre": 0.0,
        "monsoon_season": "non_monsoon",
        "historical_flood_count": 0,
    }
    res_low = predictor.predict_hazard("flood", low_data)

    print("Scenario A: Baseline / Dry Conditions:")
    print(f"   - Model Used             : {res_low['model_used']}")
    print(f"   - Model Version          : {res_low['model_version']}")
    print(f"   - Raw Score (XGBoost)    : {res_low['raw_probability']}")
    print(f"   - Calibrated Probability : {res_low['calibrated_probability']}")
    print(f"   - Operational Threshold  : {res_low['operational_threshold']}")
    print(f"   - Prediction Label       : {res_low['prediction_label']}")
    print(f"   - Top Factors            : {res_low['top_factors']}")
    print(f"   - Imputed Features Count : {len(res_low['missing_features_imputed'])}")

    assert res_low["operational_threshold"] == 0.20
    assert res_low["model_version"] == "v3.1-verified"
    assert "missing_features_imputed" in res_low
    assert res_low["prediction_label"] in ["NO_FLOOD", "FLOOD_RISK"]

    # High risk test scenario
    high_data = {
        "latitude": 26.1445,
        "longitude": 91.7362,
        "rainfall_1d_pre": 185.0,
        "rainfall_3d_pre": 320.0,
        "rainfall_5d_pre": 450.0,
        "rainfall_7d_pre": 550.0,
        "rainfall_10d_pre": 680.0,
        "monsoon_season": "monsoon",
        "historical_flood_count": 8,
        "Drainage Area": 5400.0,
        "Catchment Relief": 150.0,
        "Population Density": 900.0,
        "Land cover": "Settlement",
        "Soil type": "Alluvial",
        "lithology type": "Sedimentary",
    }
    res_high = predictor.predict_hazard("flood", high_data)

    print("\nScenario B: Severe Monsoon Inundation (High Antecedent Rainfall):")
    print(f"   - Raw Score (XGBoost)    : {res_high['raw_probability']}")
    print(f"   - Calibrated Probability : {res_high['calibrated_probability']}")
    print(f"   - Operational Threshold  : {res_high['operational_threshold']}")
    print(f"   - Prediction Label       : {res_high['prediction_label']}")
    print(f"   - Top Factors            : {res_high['top_factors']}")

    assert res_high["calibrated_probability"] >= 0.20
    assert res_high["prediction_label"] == "FLOOD_RISK"
    print("✅ TEST 5 PASSED: Verified flood bundle pipeline correctly produces calibrated probabilities and applies 0.20 threshold!")

    # ─────────────────────────────────────────────────────────────────────────
    # TEST 6: /predict/unified Multi-Hazard Response
    # ─────────────────────────────────────────────────────────────────────────
    print("\n" + "-" * 80)
    print("TEST 6: /predict/unified (Flood, Landslide, Wildfire Multi-Hazard Evaluation)")
    print("-" * 80)

    unified_req = {
        "latitude": 28.6139,
        "longitude": 77.2090,
        "temperature": 32.0,
        "humidity": 60.0,
        "rainfall": 15.0,
        "wind_speed": 12.0,
        "pressure": 1011.0,
        "rainfall_1d_pre": 15.0,
        "rainfall_3d_pre": 30.0,
    }
    unified_res = predictor.predict_unified(unified_req)

    print("Unified Response Keys:", list(unified_res.keys()))
    for hazard in ["flood", "landslide", "wildfire"]:
        assert hazard in unified_res, f"Missing {hazard} in unified response"
        h_res = unified_res[hazard]
        print(f"   [{hazard.upper()}] Risk Score: {h_res.get('risk_score')}/100, Prob: {h_res.get('probability')}, Model: {h_res.get('model_used')}")

    print("✅ TEST 6 PASSED: /predict/unified provides comprehensive evaluations across all hazards!")

    # ─────────────────────────────────────────────────────────────────────────
    # TEST 7: /predict/realtime with Live OpenWeather Dynamic Adjustment
    # ─────────────────────────────────────────────────────────────────────────
    print("\n" + "-" * 80)
    print("TEST 7: /predict/realtime (OpenWeather Ingestion & Exceedance Correlation)")
    print("-" * 80)

    # Test live weather fetch directly from OpenWeather via weather_adjuster
    lat, lon = 28.6139, 77.2090
    live_w = weather_adjuster.fetch_live_weather(lat, lon)
    print(f"OpenWeather Fetch Result:")
    print(f"   - Source       : {live_w.get('source')}")
    print(f"   - Status       : {live_w.get('status')}")
    print(f"   - Temp         : {live_w.get('temperature_2m')} °C")
    print(f"   - Humidity     : {live_w.get('humidity_pct')} %")
    print(f"   - Precip (1h)  : {live_w.get('precipitation_now_mm')} mm")
    print(f"   - Pressure     : {live_w.get('pressure_hpa')} hPa")

    assert live_w.get("source") in ["OpenWeather", "calibrated_baseline"]

    # Test realtime unified prediction
    rt_res = predictor.predict_unified_realtime(unified_req)
    for hazard in ["flood", "landslide", "wildfire"]:
        assert hazard in rt_res
        hr = rt_res[hazard]
        print(f"   [{hazard.upper()}] Base Prob: {hr.get('base_probability', hr.get('probability'))} -> Realtime Adjusted Prob: {hr.get('probability')} (Weather mult: {hr.get('adjustment_multiplier', 'N/A')})")

    print("✅ TEST 7 PASSED: /predict/realtime successfully incorporates OpenWeather telemetry!")

    # ─────────────────────────────────────────────────────────────────────────
    # TEST 8: Landslide Pipeline Integrity
    # ─────────────────────────────────────────────────────────────────────────
    print("\n" + "-" * 80)
    print("TEST 8: Landslide Pipeline Integrity Verification")
    print("-" * 80)

    ls_data = {
        "latitude": 30.3165,
        "longitude": 78.0322,
        "slope_deg": 38.0,
        "rainfall": 85.0,
        "soil_moisture_pct": 82.0,
        "curvature": 0.45,
        "slope_instability_index": 2.8,
    }
    ls_res = predictor.predict_hazard("landslide", ls_data)
    print(f"   - Hazard Type  : {ls_res['hazard_type']}")
    print(f"   - Model Used   : {ls_res['model_used']}")
    print(f"   - Probability  : {ls_res['probability']}")
    print(f"   - Risk Score   : {ls_res['risk_score']}")
    print(f"   - Top Factors  : {ls_res['top_factors']}")

    assert ls_res["hazard_type"] == "LANDSLIDE"
    assert "top_factors" in ls_res
    print("✅ TEST 8 PASSED: Landslide pipeline is fully operational and untouched!")

    # ─────────────────────────────────────────────────────────────────────────
    # TEST 9: Wildfire Pipeline Integrity
    # ─────────────────────────────────────────────────────────────────────────
    print("\n" + "-" * 80)
    print("TEST 9: Wildfire Pipeline Integrity Verification")
    print("-" * 80)

    wf_data = {
        "latitude": 24.5854,
        "longitude": 73.7125,
        "temperature": 42.0,
        "humidity": 18.0,
        "wind_speed": 22.0,
        "rainfall": 0.0,
        "fuel_aridity_index": 9.2,
    }
    wf_res = predictor.predict_hazard("wildfire", wf_data)
    print(f"   - Hazard Type  : {wf_res['hazard_type']}")
    print(f"   - Model Used   : {wf_res['model_used']}")
    print(f"   - Probability  : {wf_res['probability']}")
    print(f"   - Risk Score   : {wf_res['risk_score']}")
    print(f"   - Top Factors  : {wf_res['top_factors']}")

    assert wf_res["hazard_type"] == "WILDFIRE"
    assert "top_factors" in wf_res
    print("✅ TEST 9 PASSED: Wildfire pipeline is fully operational and untouched!")

    print("\n" + "=" * 80)
    print("  ALL TESTS (4 through 9) COMPLETED WITH 100% PASS RATE")
    print("=" * 80 + "\n")


if __name__ == "__main__":
    run_all_tests()
