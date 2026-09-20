from sqlalchemy import Column, Integer, Numeric, Date, String, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship

from app.database.database import Base


class Forecast(Base):
    __tablename__ = "forecasts"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    month = Column(Date, nullable=False)  # store as first-of-month, e.g. 2026-10-01
    predicted_amount = Column(Numeric(10, 2), nullable=False)
    actual_amount = Column(Numeric(10, 2), nullable=True)
    model_version = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User")
    category = relationship("Category")
