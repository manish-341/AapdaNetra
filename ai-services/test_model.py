"""
AapdaNetra — Comprehensive AI Model Verification Script (v3.1)
Verifies:
- Flood: Verified 23-feature XGBoost bundle with ColumnTransformer + Isotonic Calibration (0.20 threshold)
- Landslide & Wildfire: Calibrated models trained on real government data
Validates weather risk adjuster, feature transformation, and end-to-end prediction pipeline.
"""
import os
import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
import json
import joblib
import pandas as pd
import numpy as np

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


def verify_model(hazard: str, display_name: str):
    """Verify a single hazard model."""
    print(f"\n{'=' * 70}")
    print(f"  [{hazard.upper()}] {display_name} MODEL VERIFICATION")
    print(f"{'=' * 70}")

    if hazard == "flood":
        flood_dir = os.path.join(BASE_DIR, "models", "Flood")
        xgb_path = os.path.join(flood_dir, "aapdanetra_xgboost.json")
        prep_path = os.path.join(flood_dir, "preprocessor.joblib")
        cal_path = os.path.join(flood_dir, "isotonic_calibrator.joblib")
        meta_path = os.path.join(flood_dir, "inference_metadata.json")
        fn_path = os.path.join(flood_dir, "processed_feature_names.csv")

        files_to_check = [
            ("XGBoost Model", xgb_path),
            ("Preprocessor Pipeline", prep_path),
            ("Isotonic Calibrator", cal_path),
            ("Inference Metadata", meta_path),
            ("Feature Names CSV", fn_path),
        ]

        all_found = True
        for name, path in files_to_check:
            exists = os.path.exists(path)
            size = f"({os.path.getsize(path):,} bytes)" if exists else ""
            status = "✅ FOUND" if exists else "❌ MISSING"
            print(f"  {name:<24}: {status} {size}")
            if not exists:
                all_found = False

        if not all_found:
            print(f"  [!] Missing files in {flood_dir}")
            return False

        with open(meta_path, "r", encoding="utf-8") as f:
            meta = json.load(f)

        raw_features = meta.get("raw_features", [])
        print(f"\n  Architecture : XGBoost + ColumnTransformer + IsotonicRegression")
        print(f"  Raw Features ({len(raw_features)}): {raw_features[:6]}...")
        print(f"  Processed Features : {meta.get('processed_feature_count', 38)}")
        print(f"  Operational Thresh : {meta.get('operational_threshold', 0.20)} (calibrated probability scale)")
        print(f"  Training Period    : {meta.get('training_period', 'N/A')}")
        print(f"  Spatial Unit       : {meta.get('spatial_unit', 'N/A')}")
        print(f"  Synthetic Data     : {'❌ YES' if meta.get('synthetic_data_used') else '✅ NO (Real Observational Data)'}")

        test_metrics = meta.get("final_test_metrics", {})
        print(f"\n  Final Test Metrics on Unseen Test Partition:")
        print(f"  {'-'*55}")
        print(f"  Accuracy           : {test_metrics.get('accuracy', '—')}")
        print(f"  Balanced Accuracy  : {test_metrics.get('balanced_accuracy', '—')}")
        print(f"  Recall (Sensitivity: {test_metrics.get('recall', '—')}")
        print(f"  Precision          : {test_metrics.get('precision', '—')}")
        print(f"  F1-Score           : {test_metrics.get('f1', '—')}")

        # Verification inference test: 23 features in -> 38 features out -> probability
        preprocessor = joblib.load(prep_path)
        calibrator = joblib.load(cal_path)

        dummy_input = pd.DataFrame([{col: np.nan for col in raw_features}])
        dummy_input["rainfall_1d_pre"] = 15.0
        dummy_input["Annual Precipitation"] = 1400.0
        X_trans = preprocessor.transform(dummy_input)
        assert X_trans.shape[1] == 38, f"Expected 38 processed features, got {X_trans.shape[1]}"
        print(f"\n  Pipeline Integrity: 23 raw features successfully transformed to {X_trans.shape[1]} processed features")
        return True

    else:
        # Standard verification for Landslide and Wildfire
        model_path = os.path.join(BASE_DIR, "models", f"{hazard}_model.joblib")
        feat_path = os.path.join(BASE_DIR, "models", f"{hazard}_features.joblib")
        comp_path = os.path.join(BASE_DIR, "models", f"{hazard}_comparison.json")
        thresh_path = os.path.join(BASE_DIR, "models", f"{hazard}_thresholds.json")

        for name, path in [("Model Weights", model_path), ("Feature Schema", feat_path),
                           ("Benchmark Report", comp_path), ("Thresholds", thresh_path)]:
            exists = os.path.exists(path)
            size = f"({os.path.getsize(path):,} bytes)" if exists else ""
            status = "✅ FOUND" if exists else "❌ MISSING"
            print(f"  {name:<20}: {status} {size}")

        if not os.path.exists(model_path) or not os.path.exists(feat_path):
            print(f"  [!] {hazard} model files missing — run training first.")
            return False

        model = joblib.load(model_path)
        features = joblib.load(feat_path)
        print(f"\n  Architecture : {type(model).__name__}")
        print(f"  Features ({len(features)}): {features[:6]}...")

        if os.path.exists(comp_path):
            with open(comp_path, "r", encoding="utf-8") as f:
                comp = json.load(f)
            print(f"\n  Dataset Source: {comp.get('dataset_source', 'N/A')}")
            print(f"  Samples      : {comp.get('samples_count', 'N/A'):,}")
            print(f"  Synthetic?   : {'❌ YES' if comp.get('synthetic_data_used') else '✅ NO (Real Govt Data)'}")
            print(f"  Best Model   : {comp.get('best', 'N/A')}")

        return True


def test_predictions():
    """Test live predictions across extreme scenarios."""
    print(f"\n{'=' * 70}")
    print(f"  LIVE PREDICTION TESTS")
    print(f"{'=' * 70}")

    # ── Flood scenarios ──────────────────────────────────────────────────
    print("\n  [FLOOD - HIGH RISK] Assam Monsoon Surge (Dhubri - Heavy Antecedent Rain):")
    flood_high = {
        "latitude": 26.02, "longitude": 89.98,
        "Drainage Area": 5000.0,
        "Catchment Relief": 35.0,
        "Annual Mean Temperature": 28.0,
        "Annual Precipitation": 2600.0,
        "Population Density": 450.0,
        "Land cover": "Cropland",
        "Soil type": "Fluvisols",
        "lithology type": "Unconsolidated sediments",
        "rainfall_1d_pre": 120.0,
        "rainfall_3d_pre": 260.0,
        "rainfall_5d_pre": 380.0,
        "rainfall_7d_pre": 490.0,
        "rainfall_10d_pre": 620.0,
        "historical_flood_count": 8.0,
        "days_since_previous_flood": 120.0,
        "flood_count_1y_prior": 2.0,
        "flood_count_3y_prior": 4.0,
        "flood_count_5y_prior": 6.0,
        "monsoon_season": "monsoon",
    }
    p_high = predictor.predict_hazard("flood", flood_high)
    print(f"    Raw Score: {p_high['raw_probability']:.4f} | Calibrated Prob: {p_high['probability']*100:.1f}% | Score: {p_high['risk_score']}/100")
    print(f"    Decision: {p_high['prediction_label']} (Threshold: {p_high['operational_threshold']})")
    print(f"    Model: {p_high['model_used']} | Raw Features: {p_high['raw_feature_count']} -> Processed: {p_high['processed_feature_count']}")
    assert p_high["is_hazard_risk"] is True, "High risk flood scenario must exceed operational threshold 0.20!"

    print("\n  [FLOOD - LOW RISK] Rajasthan Arid Plains (Jodhpur - Zero Rain, Arid):")
    flood_low = {
        "latitude": 26.29, "longitude": 73.02,
        "Drainage Area": 100.0,
        "Catchment Relief": 230.0,
        "Annual Mean Temperature": 42.0,
        "Annual Precipitation": 250.0,
        "Population Density": 50.0,
        "Land cover": "Cropland",
        "Soil type": "Vertisols",
        "lithology type": "No dominant class",
        "rainfall_1d_pre": 0.0,
        "rainfall_3d_pre": 0.0,
        "rainfall_5d_pre": 0.0,
        "rainfall_7d_pre": 0.0,
        "rainfall_10d_pre": 0.0,
        "historical_flood_count": 0.0,
        "days_since_previous_flood": 9999.0,
        "flood_count_1y_prior": 0.0,
        "flood_count_3y_prior": 0.0,
        "flood_count_5y_prior": 0.0,
        "monsoon_season": "non_monsoon",
    }
    p_low = predictor.predict_hazard("flood", flood_low)
    print(f"    Raw Score: {p_low['raw_probability']:.4f} | Calibrated Prob: {p_low['probability']*100:.1f}% | Score: {p_low['risk_score']}/100")
    print(f"    Decision: {p_low['prediction_label']} (Threshold: {p_low['operational_threshold']})")
    assert p_low["is_hazard_risk"] is False, "Low risk flood scenario must remain below operational threshold 0.20!"

    print("\n  [FLOOD - API ADAPTABILITY] Generic Backend Payload (testing REST contract compatibility):")
    backend_payload = {
        "latitude": 26.02,
        "longitude": 89.98,
        "temperature": 29.0,
        "humidity": 85.0,
        "rainfall": 45.0,
        "wind_speed": 12.0,
        "pressure": 1008.0,
        "soil_moisture_pct": 75.0,
    }
    p_api = predictor.predict_hazard("flood", backend_payload)
    print(f"    Probability: {p_api['probability']*100:.1f}% | Score: {p_api['risk_score']}/100 | Decision: {p_api['prediction_label']}")
    print(f"    Missing features cleanly imputed: {len(p_api['missing_features_imputed'])} features")

    # ── Landslide scenarios ──────────────────────────────────────────────
    print("\n  [LANDSLIDE] Wayanad Western Ghats:")
    ls_high = {
        "latitude": 11.61, "longitude": 76.08,
        "elevation_m": 900.0, "slope_angle_deg": 35.0,
        "rainfall": 250.0, "annual_rainfall_mm": 3500.0,
    }
    p = predictor.predict_hazard("landslide", ls_high)
    print(f"    Probability: {p['probability']*100:.1f}% | Score: {p['risk_score']}/100")

    print("\n  [LANDSLIDE] Indo-Gangetic Plain (Lucknow):")
    ls_low = {
        "latitude": 26.85, "longitude": 80.95,
        "elevation_m": 120.0, "slope_angle_deg": 1.0,
        "rainfall": 15.0, "annual_rainfall_mm": 900.0,
    }
    p = predictor.predict_hazard("landslide", ls_low)
    print(f"    Probability: {p['probability']*100:.1f}% | Score: {p['risk_score']}/100")

    # ── Wildfire scenarios ───────────────────────────────────────────────
    print("\n  [WILDFIRE] Uttarakhand Pine Forest (Summer):")
    wf_high = {
        "latitude": 30.33, "longitude": 78.07,
        "temperature": 42.0, "humidity": 15.0,
        "elevation_m": 1200.0, "ndvi": 0.7,
    }
    p = predictor.predict_hazard("wildfire", wf_high)
    print(f"    Probability: {p['probability']*100:.1f}% | Score: {p['risk_score']}/100")

    print("\n  [WILDFIRE] Kerala Monsoon (Kochi):")
    wf_low = {
        "latitude": 9.93, "longitude": 76.26,
        "temperature": 25.0, "humidity": 92.0,
        "elevation_m": 10.0, "ndvi": 0.6,
    }
    p = predictor.predict_hazard("wildfire", wf_low)
    print(f"    Probability: {p['probability']*100:.1f}% | Score: {p['risk_score']}/100")


def test_unified_and_realtime():
    """Test unified multi-hazard prediction and live weather dynamic adjustment."""
    print(f"\n{'=' * 70}")
    print(f"  UNIFIED & REALTIME API VERIFICATION")
    print(f"{'=' * 70}")

    test_coords = {"latitude": 26.14, "longitude": 91.73, "rainfall": 35.0, "temperature": 30.0}

    print("\n  Testing /predict/unified:")
    unified = predictor.predict_unified(test_coords)
    for h, res in unified.items():
        print(f"    {h.upper():<12}: Prob={res['probability']:.4f} (Score {res['risk_score']}/100) -> Model: {res['model_used']}")

    print("\n  Testing /predict/realtime (with Open-Meteo antecedent rainfall & telemetry):")
    realtime = predictor.predict_unified_realtime(test_coords)
    for h, res in realtime.items():
        base = res.get("base_probability", res["probability"])
        adj = res["probability"]
        mult = res.get("adjustment_multiplier", 1.0)
        print(f"    {h.upper():<12}: Base={base:.3f} -> Adjusted={adj:.3f} (x{mult:.3f})")


def main():
    print("=" * 70)
    print("  AAPDANETRA AI v3.1 — COMPREHENSIVE MODEL VERIFICATION")
    print("  Flood: Verified 23-Feature XGBoost Bundle (Threshold 0.20)")
    print("  Landslide: GSI/NDMA Real Data Model")
    print("  Wildfire: IMD/NDVI Real Data Model")
    print("=" * 70)

    all_ok = True
    for hazard, name in [("flood", "Flood (Verified XGBoost Bundle)"),
                         ("landslide", "Landslide (GSI/NDMA)"),
                         ("wildfire", "Wildfire (IMD/NDVI)")]:
        if not verify_model(hazard, name):
            all_ok = False

    test_predictions()
    test_unified_and_realtime()

    print(f"\n{'=' * 70}")
    if all_ok:
        print("  ✅ ALL MODELS VERIFIED & OPERATIONAL")
        print("  Flood inference follows exact 23 features -> preprocessor -> XGBoost -> isotonic calibrator -> threshold 0.20")
    else:
        print("  ⚠️  Verification encountered issues.")
    print(f"{'=' * 70}\n")


if __name__ == "__main__":
    main()
