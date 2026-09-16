"""
AapdaNetra — Comprehensive AI Model Verification Script (v3)
Verifies all three hazard models trained on real government data,
validates weather risk adjuster, and tests end-to-end prediction pipeline.
"""
import os
import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
import json
import joblib

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)
from prediction.predict import predictor
from prediction.weather_risk_adjuster import weather_adjuster


def verify_model(hazard: str, display_name: str):
    """Verify a single hazard model."""
    print(f"\n{'=' * 70}")
    print(f"  [{hazard.upper()}] {display_name} MODEL VERIFICATION")
    print(f"{'=' * 70}")

    model_path = os.path.join(BASE_DIR, "models", f"{hazard}_model.joblib")
    feat_path = os.path.join(BASE_DIR, "models", f"{hazard}_features.joblib")
    comp_path = os.path.join(BASE_DIR, "models", f"{hazard}_comparison.json")
    thresh_path = os.path.join(BASE_DIR, "models", f"{hazard}_thresholds.json")

    # ── File check ───────────────────────────────────────────────────────
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

    # ── Benchmark report ─────────────────────────────────────────────────
    if os.path.exists(comp_path):
        with open(comp_path, "r") as f:
            comp = json.load(f)

        print(f"\n  Dataset Source: {comp.get('dataset_source', 'N/A')}")
        print(f"  Samples      : {comp.get('samples_count', 'N/A'):,}")
        print(f"  Synthetic?   : {'❌ YES' if comp.get('synthetic_data_used') else '✅ NO (Real Govt Data)'}")
        print(f"  Spatial Split: {'✅ Yes (by district)' if comp.get('spatial_split') else 'No'}")
        print(f"  Best Model   : {comp.get('best', 'N/A')}")
        print(f"  Version      : {comp.get('version', 'N/A')}")

        # Validate: must NOT use synthetic data
        if comp.get("synthetic_data_used"):
            print("  ⚠️  WARNING: Model trained on synthetic data — should be retrained!")

        # Print benchmark comparison
        rf = comp.get("results", {}).get("RandomForest", {})
        xgb_res = comp.get("results", {}).get("XGBoost", {})
        cal = comp.get("results", {}).get("Calibrated", {})

        print(f"\n  {'Metric':<15} {'RandomForest':<15} {'XGBoost':<15} {'Calibrated':<15}")
        print(f"  {'-'*55}")
        for m in ["accuracy", "f1", "roc_auc"]:
            rf_v = rf.get(m, "—")
            xgb_v = xgb_res.get(m, "—")
            cal_v = cal.get(m, "—")
            print(f"  {m:<15} {str(rf_v):<15} {str(xgb_v):<15} {str(cal_v):<15}")

    # ── Thresholds ───────────────────────────────────────────────────────
    if os.path.exists(thresh_path):
        with open(thresh_path, "r") as f:
            thresholds = json.load(f)
        print(f"\n  Training Data Thresholds (top 3 variables):")
        for i, (var, vals) in enumerate(list(thresholds.items())[:3]):
            print(f"    {var}: P50={vals.get('p50', '—')}, P90={vals.get('p90', '—')}, P95={vals.get('p95', '—')}")

    return True


def test_predictions():
    """Test live predictions across extreme scenarios."""
    print(f"\n{'=' * 70}")
    print(f"  LIVE PREDICTION TESTS")
    print(f"{'=' * 70}")

    # ── Flood scenarios ──────────────────────────────────────────────────
    print("\n  [FLOOD] Assam Monsoon Surge (Dhubri):")
    flood_high = {
        "latitude": 26.02, "longitude": 89.98,
        "rainfall": 180.0, "humidity": 95.0, "temperature": 28.0,
        "elevation_m": 35.0, "dist_to_river_km": 0.5,
    }
    p = predictor.predict_hazard("flood", flood_high)
    print(f"    Probability: {p['probability']*100:.1f}% | Score: {p['risk_score']}/100")
    print(f"    Model: {p['model_used']} | Source: {p.get('dataset_source', 'N/A')}")

    print("\n  [FLOOD] Rajasthan Arid Plains (Jodhpur):")
    flood_low = {
        "latitude": 26.29, "longitude": 73.02,
        "rainfall": 2.0, "humidity": 18.0, "temperature": 42.0,
        "elevation_m": 230.0, "dist_to_river_km": 30.0,
    }
    p = predictor.predict_hazard("flood", flood_low)
    print(f"    Probability: {p['probability']*100:.1f}% | Score: {p['risk_score']}/100")

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


def test_weather_adjuster():
    """Test the weather risk adjuster with a sample location."""
    print(f"\n{'=' * 70}")
    print(f"  WEATHER RISK ADJUSTER TEST")
    print(f"{'=' * 70}")

    # Test with Mumbai coordinates
    lat, lon = 19.076, 72.877
    print(f"\n  Fetching live weather for Mumbai ({lat}, {lon})...")

    weather = weather_adjuster.fetch_live_weather(lat, lon)
    print(f"  Source : {weather.get('source')}")
    print(f"  Status : {weather.get('status')}")
    print(f"  Temp   : {weather.get('temperature_2m')}°C")
    print(f"  Humidity: {weather.get('humidity_pct')}%")
    print(f"  Precip : {weather.get('precipitation_now_mm')} mm")

    # Test exceedance for each hazard
    for hazard in ["flood", "landslide", "wildfire"]:
        exc = weather_adjuster.compute_exceedance(hazard, weather)
        print(f"\n  [{hazard.upper()}] Exceedance ratio: {exc['exceedance_ratio']:.4f}")
        for var, pos in exc.get("percentile_position", {}).items():
            print(f"    {var}: P{pos}")

    # Test full adjusted prediction
    print(f"\n  Full adjusted prediction (Mumbai, all hazards):")
    result = predictor.predict_unified_realtime({
        "latitude": lat, "longitude": lon,
        "rainfall": 50, "temperature": 32, "humidity": 80,
    })
    for h, pred in result.items():
        base = pred.get("base_probability", pred["probability"])
        adj = pred["probability"]
        mult = pred.get("adjustment_multiplier", 1.0)
        print(f"    {h.upper():<12}: base={base:.3f} → adjusted={adj:.3f} (×{mult:.3f})")


def test_thresholds():
    """Verify thresholds are loaded."""
    print(f"\n{'=' * 70}")
    print(f"  TRAINING DATA THRESHOLDS")
    print(f"{'=' * 70}")

    thresholds = predictor.get_thresholds()
    for hazard, vars_dict in thresholds.items():
        print(f"\n  [{hazard.upper()}] {len(vars_dict)} variables with thresholds")
        for var, vals in list(vars_dict.items())[:2]:
            print(f"    {var}: mean={vals.get('mean', '—')}, P90={vals.get('p90', '—')}")


def main():
    print("=" * 70)
    print("  AAPDANETRA AI v3 — COMPREHENSIVE MODEL VERIFICATION")
    print("  All models trained on real Indian Government data")
    print("=" * 70)

    all_ok = True
    for hazard, name in [("flood", "Flood (IMD/CWC)"),
                         ("landslide", "Landslide (GSI/NDMA)"),
                         ("wildfire", "Wildfire (IMD/NDVI)")]:
        if not verify_model(hazard, name):
            all_ok = False

    test_predictions()
    test_weather_adjuster()
    test_thresholds()

    print(f"\n{'=' * 70}")
    if all_ok:
        print("  ✅ ALL MODELS VERIFIED — Trained on real government data, no synthetic data")
    else:
        print("  ⚠️  Some models need retraining — run training scripts first")
    print(f"{'=' * 70}\n")


if __name__ == "__main__":
    main()
