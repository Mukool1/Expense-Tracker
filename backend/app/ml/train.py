import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
from app.ml.category_encoding import normalize_category_name, CATEGORY_FEATURE_COLS
from app.models.category import Category
from app.database.database import SessionLocal
from app.models.transaction import Transaction

MODEL_PATH = "app/ml/artifacts/spend_forecast_model.pkl"

# Minimum usable rows after feature engineering before we bother training.
MIN_TRAIN_ROWS = 10


def load_monthly_spend() -> pd.DataFrame:
    """Pull every transaction and collapse it into one row per (user, category, month)."""
    db = SessionLocal()
    try:
        rows = db.query(
            Transaction.user_id,
            Transaction.category_id,
            Category.name.label("category_name"),
            Transaction.transaction_date,
            Transaction.amount,
        ).join(Category, Transaction.category_id == Category.id).all()

        data = [{
            "user_id": r.user_id,
            "category_id": r.category_id,
            "category_name": normalize_category_name(r.category_name),
            "month": r.transaction_date.replace(day=1),
            "amount": float(r.amount),
        } for r in rows]
    finally:
        db.close()

    # NOTE: columns= is deliberate. pd.DataFrame([]) on an empty query result
    # creates a column-less DataFrame, and the groupby below then blows up with
    # KeyError('user_id'). With columns= declared, an empty result stays a
    # well-shaped empty DataFrame and everything downstream handles it.
    df = pd.DataFrame(
        data,
        columns=["user_id", "category_id", "category_name", "month", "amount"],
    )
    if df.empty:
        return df.rename(columns={"amount": "actual_spend"})

    monthly = df.groupby(["user_id", "category_id", "category_name", "month"], as_index=False)["amount"].sum()
    return monthly.rename(columns={"amount": "actual_spend"}).sort_values(["user_id", "category_id", "month"])


def build_features(monthly: pd.DataFrame) -> pd.DataFrame:
    """For each (user, category, month) row, compute features from PRIOR months only."""
    monthly = monthly.copy()
    grouped = monthly.groupby(["user_id", "category_id"])["actual_spend"]

    monthly["spend_last_month"] = grouped.shift(1)
    monthly["spend_avg_3mo"] = grouped.shift(1).rolling(window=3).mean()
    monthly["spend_avg_6mo"] = grouped.shift(1).rolling(window=6).mean()
    monthly["month_number"] = pd.to_datetime(monthly["month"]).dt.month
    monthly = monthly.dropna(subset=["spend_last_month", "spend_avg_3mo", "spend_avg_6mo"])

    # one-hot encode category NAME, not the arbitrary per-user ID
    dummies = pd.get_dummies(monthly["category_name"], prefix="cat")
    monthly = pd.concat([monthly, dummies], axis=1)
    for col in CATEGORY_FEATURE_COLS:  # guarantee every known column exists, even if unused in this batch
        if col not in monthly.columns:
            monthly[col] = 0
    return monthly


def train():
    monthly = load_monthly_spend()
    if monthly.empty:
        print("No transactions found — skipping forecast training (keeping existing model).")
        return

    featured = build_features(monthly)
    if len(featured) < MIN_TRAIN_ROWS:
        print(
            f"Only {len(featured)} usable training rows (need {MIN_TRAIN_ROWS}) — "
            "skipping forecast training (keeping existing model)."
        )
        return

    feature_cols = ["spend_last_month", "spend_avg_3mo", "spend_avg_6mo", "month_number"] + CATEGORY_FEATURE_COLS
    X = featured[feature_cols]
    y = featured["actual_spend"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = RandomForestRegressor(n_estimators=100, max_depth=5, random_state=42)
    model.fit(X_train, y_train)

    predictions = model.predict(X_test)
    mae = mean_absolute_error(y_test, predictions)
    r2 = r2_score(y_test, predictions)

    print(f"Trained on {len(X_train)} rows, tested on {len(X_test)} rows")
    print(f"MAE:  ₹{mae:.2f}  (on average, predictions are off by this much)")
    print(f"R²:   {r2:.3f}  (1.0 = perfect, 0.0 = no better than guessing the average)")

    joblib.dump({"model": model, "feature_cols": feature_cols}, MODEL_PATH)
    print(f"Saved model to {MODEL_PATH}")


if __name__ == "__main__":
    train()
