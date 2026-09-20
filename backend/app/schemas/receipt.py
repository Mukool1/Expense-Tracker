from datetime import date, datetime
from pydantic import BaseModel


class ReceiptParsed(BaseModel):
    """What we hand back to the frontend right after OCR — before the user confirms it."""
    image_url: str
    raw_ocr_text: str
    parsed_confidence: float
    suggested_merchant: str | None
    suggested_amount: float | None
    suggested_date: date | None


class ReceiptOut(BaseModel):
    id: int
    image_url: str
    parsed_confidence: float | None
    created_at: datetime

    class Config:
        from_attributes = True