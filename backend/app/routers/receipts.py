import shutil, uuid, os
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
import cloudinary.uploader

from app.database.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.ocr.parser import extract_text, parse_receipt
from app.schemas.receipt import ReceiptParsed

router = APIRouter()

UPLOAD_DIR = "/tmp/receipt_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/scan", response_model=ReceiptParsed)
def scan_receipt(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    if file.content_type not in ("image/jpeg", "image/png", "image/jpg"):
        raise HTTPException(status_code=400, detail="Upload a JPEG or PNG image")

    # save temporarily so EasyOCR (and Cloudinary) can read it from disk
    temp_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")
    with open(temp_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    try:
        upload_result = cloudinary.uploader.upload(temp_path, folder="expense-tracker/receipts")
        image_url = upload_result["secure_url"]

        raw_text, confidence = extract_text(temp_path)
        parsed = parse_receipt(raw_text)
    finally:
        os.remove(temp_path)  # don't keep receipt images on our own disk — Cloudinary is the store of record

    return ReceiptParsed(
        image_url=image_url,
        raw_ocr_text=raw_text,
        parsed_confidence=confidence,
        suggested_merchant=parsed["merchant"],
        suggested_amount=parsed["total"],
        suggested_date=parsed["date"],
    )