from app.models.user import User
from app.models.category import Category
from datetime import date
from dateutil.relativedelta import relativedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.category import Category
from app.models.transaction import Transaction
from app.ml.predict import predict_next_month_spend


def _monthly_total(db: Session, user_id: int, category_id: int, month: date) -> float:
    month_start = month.replace(day=1)
    month_end = month_start + relativedelta(months=1)
    total = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == user_id,
        Transaction.category_id == category_id,
        Transaction.transaction_date >= month_start,
        Transaction.transaction_date < month_end,
    ).scalar()
    return float(total) if total else 0.0


def _population_average_for_category(db: Session, category_id: int, exclude_user_id: int) -> float | None:
    from app.models.category import Category
    from app.models.user import User

    this_category = db.query(Category).filter(Category.id == category_id).first()
    if not this_category:
        return None

    rows = db.query(
        Transaction.user_id,
        func.date_trunc("month", Transaction.transaction_date).label("month"),
        func.sum(Transaction.amount).label("total"),
    ).join(Category, Transaction.category_id == Category.id
    ).join(User, Transaction.user_id == User.id
    ).filter(
        func.lower(Category.name) == this_category.name.lower(),
        Transaction.user_id != exclude_user_id,
        User.email != "demo@example.com",
        Transaction.is_anomaly.isnot(True),  # exclude known outliers from the "typical" baseline
    ).group_by(Transaction.user_id, "month").all()

    if not rows:
        return None
    return round(sum(float(r.total) for r in rows) / len(rows), 2)

def get_forecast_for_category(db: Session, user_id: int, category_id: int) -> dict:
    category = db.query(Category).filter(Category.id == category_id).first()
    category_name = category.name if category else "other"
    today = date.today().replace(day=1)

    last_month = today - relativedelta(months=1)
    spend_last_month = _monthly_total(db, user_id, category_id, last_month)
    last_3 = [_monthly_total(db, user_id, category_id, today - relativedelta(months=i)) for i in range(1, 4)]
    spend_avg_3mo = sum(last_3) / len(last_3)
    last_6 = [_monthly_total(db, user_id, category_id, today - relativedelta(months=i)) for i in range(1, 7)]
    spend_avg_6mo = sum(last_6) / len(last_6)

    has_own_history = not (spend_last_month == 0 and spend_avg_3mo == 0 and spend_avg_6mo == 0)

    if not has_own_history:
        population_avg = _population_average_for_category(db, category_id, exclude_user_id=user_id)
        return {
            "category_id": category_id,
            "predicted_amount": population_avg,
            "personalized": False,
            "based_on": {"spend_last_month": 0, "spend_avg_3mo": 0, "spend_avg_6mo": 0},
            "message": (
                "Estimate based on similar users — add a few transactions to personalize this."
                if population_avg is not None
                else "Not enough data yet to estimate this category."
            ),
        }

    predicted = predict_next_month_spend(
        spend_last_month=spend_last_month,
        spend_avg_3mo=spend_avg_3mo,
        spend_avg_6mo=spend_avg_6mo,
        target_month=today,
        category_name=category_name,  # changed from category_id
    )
    return {
        "category_id": category_id,
        "predicted_amount": predicted,
        "personalized": True,
        "based_on": {
            "spend_last_month": spend_last_month,
            "spend_avg_3mo": round(spend_avg_3mo, 2),
            "spend_avg_6mo": round(spend_avg_6mo, 2),
        },
        "message": None,
    }