import joblib
import pandas as pd
from datetime import date
from app.ml.category_encoding import normalize_category_name


MODEL_PATH = "app/ml/artifacts/spend_forecast_model.pkl"

_model_bundle = None  # loaded once, lazily, then reused — same idea as the EasyOCR reader


def _get_model_bundle():
    global _model_bundle
    if _model_bundle is None:
        _model_bundle = joblib.load(MODEL_PATH)
    return _model_bundle

def predict_next_month_spend(
    spend_last_month: float,
    spend_avg_3mo: float,
    spend_avg_6mo: float,
    target_month: date,
    category_name: str,   # changed from category_id
) -> float:
    bundle = _get_model_bundle()
    model = bundle["model"]
    feature_cols = bundle["feature_cols"]

    normalized = normalize_category_name(category_name)
    row = {
        "spend_last_month": spend_last_month,
        "spend_avg_3mo": spend_avg_3mo,
        "spend_avg_6mo": spend_avg_6mo,
        "month_number": target_month.month,
    }
    for col in feature_cols:
        if col.startswith("cat_"):
            row[col] = 1 if col == f"cat_{normalized}" else 0

    row_df = pd.DataFrame([row])[feature_cols]
    prediction = model.predict(row_df)[0]
    return max(0.0, round(float(prediction), 2))