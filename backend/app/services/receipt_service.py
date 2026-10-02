"""Synchronous receipt scanning: Cloudinary upload -> RapidOCR -> parse.

Runs in-process so no worker/Redis is needed on deploy.
"""
import logging
import time

import cloudinary
import cloudinary.uploader
from PIL import Image, ImageOps

from app.core.config import settings
from app.ocr.parser import extract_text, parse_receipt

logger = logging.getLogger(__name__)

# Free-tier hosts have ~512MB RAM and a throttled CPU: keep the OCR input
# small. Receipt text is large print, so 1000px is plenty for accuracy while
# keeping detection fast and memory-light (scales ~quadratically).
MAX_OCR_WIDTH = 1000


def _downscale_image(path: str) -> None:
    with Image.open(path) as img:
        # Phone photos are often stored rotated with an EXIF flag — without
        # this the OCR sees sideways text.
        img = ImageOps.exif_transpose(img)
        if img.width > MAX_OCR_WIDTH:
            ratio = MAX_OCR_WIDTH / img.width
            img = img.resize(
                (MAX_OCR_WIDTH, int(img.height * ratio)), Image.LANCZOS
            )
        # Always re-save: bakes in the EXIF rotation even when no resize
        # was needed.
        img.save(path)


def scan_receipt_image(
    temp_image_path: str,
    cloudinary_folder: str = "expense-tracker/receipts",
) -> dict:
    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
    )

    t0 = time.time()
    _downscale_image(temp_image_path)
    logger.info("scan: downscaled in %.1fs", time.time() - t0)

    t0 = time.time()
    upload_result = cloudinary.uploader.upload(
        temp_image_path,
        folder=cloudinary_folder,
    )
    image_url = upload_result["secure_url"]
    logger.info("scan: cloudinary upload in %.1fs", time.time() - t0)

    t0 = time.time()
    raw_text, confidence = extract_text(temp_image_path)
    logger.info(
        "scan: OCR in %.1fs (%d chars)", time.time() - t0, len(raw_text)
    )
    parsed = parse_receipt(raw_text)

    return {
        "image_url": image_url,
        "raw_ocr_text": raw_text,
        "parsed_confidence": confidence,
        "suggested_merchant": parsed["merchant"],
        "suggested_amount": parsed["total"],
        "suggested_date": (
            parsed["date"].isoformat() if parsed["date"] else None
        ),
    }
