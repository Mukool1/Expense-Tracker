from pydantic import BaseModel

class ForecastBreakdown(BaseModel):
    spend_last_month: float
    spend_avg_3mo: float
    spend_avg_6mo: float


class ForecastOut(BaseModel):
    category_id: int
    predicted_amount: float | None
    personalized: bool
    based_on: ForecastBreakdown
    message: str | None = None