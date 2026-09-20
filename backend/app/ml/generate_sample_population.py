import random
from datetime import date
from decimal import Decimal
from dateutil.relativedelta import relativedelta

from app.database.database import SessionLocal
from app.models.user import User
from app.models.category import Category
from app.models.transaction import Transaction
from app.core.security import hash_password

# Each "persona" has different spending habits per category — this is what makes
# the population data realistic instead of one uniform pattern repeated.
SAMPLE_USERS = [
    {
        "email": "sample.frugal@internal.local",
        "categories": {
            "Rent": {"baseline": 9000, "variance": 100},
            "Groceries": {"baseline": 3500, "variance": 600},
            "Transport": {"baseline": 800, "variance": 200},
            "Entertainment": {"baseline": 500, "variance": 300},
            "Shopping": {"baseline": 700, "variance": 400, "seasonal": {12: 1.8}},
        },
    },
    {
        "email": "sample.average@internal.local",
        "categories": {
            "Rent": {"baseline": 14000, "variance": 300},
            "Groceries": {"baseline": 6500, "variance": 1000},
            "Transport": {"baseline": 2200, "variance": 500},
            "Entertainment": {"baseline": 1800, "variance": 700},
            "Shopping": {"baseline": 2500, "variance": 900, "seasonal": {12: 2.2, 11: 1.3}},
        },
    },
    {
        "email": "sample.highspender@internal.local",
        "categories": {
            "Rent": {"baseline": 25000, "variance": 500},
            "Groceries": {"baseline": 12000, "variance": 2000},
            "Transport": {"baseline": 5000, "variance": 1200},
            "Entertainment": {"baseline": 4000, "variance": 1500},
            "Shopping": {"baseline": 6000, "variance": 2500, "seasonal": {12: 2.5, 11: 1.5}},
        },
    },
    {
        "email": "sample.student@internal.local",
        "categories": {
            "Rent": {"baseline": 6000, "variance": 200},
            "Groceries": {"baseline": 2800, "variance": 500},
            "Transport": {"baseline": 1200, "variance": 400},
            "Entertainment": {"baseline": 1000, "variance": 600},
            "Shopping": {"baseline": 900, "variance": 500, "seasonal": {12: 1.6}},
        },
    },
]

NUM_MONTHS = 18


def generate_month_transactions(profile: dict, month_date: date):
    seasonal_mult = profile.get("seasonal", {}).get(month_date.month, 1.0)
    monthly_total = max(0, random.gauss(profile["baseline"], profile["variance"]) * seasonal_mult)

    num_transactions = random.randint(1, 5)
    amounts, remaining = [], monthly_total
    for _ in range(num_transactions - 1):
        share = remaining * random.uniform(0.1, 0.5)
        amounts.append(share)
        remaining -= share
    amounts.append(max(remaining, 0))

    return [
        {"amount": Decimal(str(round(amt, 2))), "transaction_date": month_date.replace(day=random.randint(1, 28))}
        for amt in amounts
    ]


def seed_sample_population():
    db = SessionLocal()
    try:
        today = date.today().replace(day=1)
        total_created = 0

        for sample in SAMPLE_USERS:
            user = db.query(User).filter(User.email == sample["email"]).first()
            if not user:
                user = User(email=sample["email"], hashed_password=hash_password("not-a-real-login"))
                db.add(user)
                db.commit()
                db.refresh(user)
                print(f"Created sample user: {user.email}")

            categories = {}
            for name in sample["categories"]:
                cat = db.query(Category).filter(Category.name == name, Category.user_id == user.id).first()
                if not cat:
                    cat = Category(name=name, user_id=user.id, is_default=False)
                    db.add(cat)
                    db.commit()
                    db.refresh(cat)
                categories[name] = cat

            for i in range(NUM_MONTHS, 0, -1):
                month_date = today - relativedelta(months=i)
                for cat_name, profile in sample["categories"].items():
                    for tx_data in generate_month_transactions(profile, month_date):
                        db.add(Transaction(
                            user_id=user.id,
                            category_id=categories[cat_name].id,
                            amount=tx_data["amount"],
                            merchant=f"{cat_name} vendor",
                            transaction_date=tx_data["transaction_date"],
                            source="manual",
                        ))
                        total_created += 1
            db.commit()

        print(f"Seeded {total_created} transactions across {len(SAMPLE_USERS)} sample users")
    finally:
        db.close()


if __name__ == "__main__":
    seed_sample_population()