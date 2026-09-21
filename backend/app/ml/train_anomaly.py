import pandas as pd
from sklearn.ensemble import IsolationForest
import joblib

from app.database.database import SessionLocal
from app.models.transaction import Transaction
from app.models.category import Category
from app.models.user import User
from app.ml.category_encoding import normalize_category_name, CATEGORY_FEATURE_COLS

MODEL_PATH = "app/ml/artifacts/anomaly_model.pkl"


def load_transactions_df() -> pd.DataFrame:
    db = SessionLocal()
    try:
        rows = db.query(
            Transaction.amount,
            Transaction.transaction_date,
            Category.name.label("category_name"),
        ).join(Category, Transaction.category_id == Category.id
        ).join(User, Transaction.user_id == User.id
        ).filter(User.email != "demo@example.com").all()

        data = [{
            "amount": float(r.amount),
            "category_name": normalize_category_name(r.category_name),
            "day_of_month": r.transaction_date.day,
            "month_number": r.transaction_date.month,
        } for r in rows]
    finally:
        db.close()
    return pd.DataFrame(data)


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    dummies = pd.get_dummies(df["category_name"], prefix="cat")
    df = pd.concat([df, dummies], axis=1)
    for col in CATEGORY_FEATURE_COLS:
        if col not in df.columns:
            df[col] = 0
    return df


def train():
    df = load_transactions_df()
    featured = build_features(df)
    feature_cols = ["amount", "day_of_month", "month_number"] + CATEGORY_FEATURE_COLS
    X = featured[feature_cols]

    # contamination = our assumption of what % of transactions are genuinely unusual
    model = IsolationForest(contamination=0.05, random_state=42)
    model.fit(X)

    joblib.dump({"model": model, "feature_cols": feature_cols}, MODEL_PATH)
    print(f"Trained anomaly model on {len(X)} transactions")
    print(f"Saved to {MODEL_PATH}")


if __name__ == "__main__":
    train()