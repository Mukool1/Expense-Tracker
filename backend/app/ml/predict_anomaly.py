import joblib
import pandas as pd
from datetime import date

from app.ml.category_encoding import normalize_category_name

MODEL_PATH = "app/ml/artifacts/anomaly_model.pkl"
_bundle = None


def _get_bundle():
    global _bundle
    if _bundle is None:
        _bundle = joblib.load(MODEL_PATH)
    return _bundle


def check_anomaly(amount: float, category_name: str, transaction_date: date) -> dict:
    bundle = _get_bundle()
    model = bundle["model"]
    feature_cols = bundle["feature_cols"]

    normalized = normalize_category_name(category_name)
    row = {"amount": amount, "day_of_month": transaction_date.day, "month_number": transaction_date.month}
    for col in feature_cols:
        if col.startswith("cat_"):
            row[col] = 1 if col == f"cat_{normalized}" else 0

    row_df = pd.DataFrame([row])[feature_cols]

    prediction = model.predict(row_df)[0]        # -1 = anomaly, 1 = normal — IsolationForest's own convention
    score = model.decision_function(row_df)[0]    # continuous score; more negative = more anomalous

    return {"is_anomaly": bool(prediction == -1), "anomaly_score": round(float(score), 3)}