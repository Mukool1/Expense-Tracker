from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel
from app.schemas.category import CategoryOut


class TransactionCreate(BaseModel):
    category_id: int
    amount: Decimal
    merchant: str | None = None
    transaction_date: date


class TransactionOut(BaseModel):
    id: int
    amount: Decimal
    merchant: str | None
    transaction_date: date
    source: str
    created_at: datetime
    category: CategoryOut  # nested — comes from the relationship, not a raw category_id

    class Config:
        from_attributes = True