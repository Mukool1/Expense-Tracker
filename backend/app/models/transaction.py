from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from app.database.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    merchant = Column(String, nullable=True)
    transaction_date = Column(Date, nullable=False)
    source = Column(String, default="manual")  # "manual" or "receipt"
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")
    receipt = relationship("Receipt", back_populates="transaction", uselist=False, cascade="all, delete-orphan")
