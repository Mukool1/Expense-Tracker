import random
from datetime import date
from decimal import Decimal
from dateutil.relativedelta import relativedelta

from app.database.database import SessionLocal
from app.models.user import User
from app.models.category import Category
from app.models.transaction import Transaction
from app.core.security import hash_password

# Each category gets a baseline monthly spend, how much it naturally varies,
# and an optional seasonal multiplier keyed by month number (1-12).
CATEGORY_PROFILES = {
    "Rent":          {"baseline": 15000, "variance": 200,  "seasonal": {}},
    "Groceries":     {"baseline": 6000,  "variance": 1200, "seasonal": {}},
    "Transport":     {"baseline": 2000,  "variance": 500,  "seasonal": {}},
    "Entertainment": {"baseline": 1500,  "variance": 800,  "seasonal": {}},
    "Shopping":      {"baseline": 2500,  "variance": 1000, "seasonal": {12: 2.5, 11: 1.4}},  # festive/year-end spike
}

NUM_MONTHS = 24  # 2 years of history


def generate_month_transactions(category_name: str, profile: dict, month_date: date):
    seasonal_mult = profile["seasonal"].get(month_date.month, 1.0)
    monthly_total = max(0, random.gauss(profile["baseline"], profile["variance"]) * seasonal_mult)

    # split the month's total across 1-5 individual transactions, so it looks like real spending
    num_transactions = random.randint(1, 5)
    amounts = []
    remaining = monthly_total
    for i in range(num_transactions - 1):
        share = remaining * random.uniform(0.1, 0.5)
        amounts.append(share)
        remaining -= share
    amounts.append(max(remaining, 0))

    transactions = []
    for amt in amounts:
        day = random.randint(1, 28)
        transactions.append({
            "amount": Decimal(str(round(amt, 2))),
            "transaction_date": month_date.replace(day=day),
        })
    return transactions


def seed_fake_data():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "demo@example.com").first()
        if not user:
            user = User(email="demo@example.com", hashed_password=hash_password("demo1234"))
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"Created demo user: {user.email} / demo1234")

        categories = {}
        for name in CATEGORY_PROFILES:
            cat = db.query(Category).filter(Category.name == name, Category.user_id == user.id).first()
            if not cat:
                cat = Category(name=name, user_id=user.id, is_default=False)
                db.add(cat)
                db.commit()
                db.refresh(cat)
            categories[name] = cat

        today = date.today().replace(day=1)
        created_count = 0
        for i in range(NUM_MONTHS, 0, -1):
            month_date = today - relativedelta(months=i)
            for cat_name, profile in CATEGORY_PROFILES.items():
                for tx_data in generate_month_transactions(cat_name, profile, month_date):
                    tx = Transaction(
                        user_id=user.id,
                        category_id=categories[cat_name].id,
                        amount=tx_data["amount"],
                        merchant=f"{cat_name} vendor",
                        transaction_date=tx_data["transaction_date"],
                        source="manual",
                    )
                    db.add(tx)
                    created_count += 1

        db.commit()
        print(f"Seeded {created_count} fake transactions across {NUM_MONTHS} months for {user.email}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_fake_data()