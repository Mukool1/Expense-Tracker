from app.tasks.celery_app import celery_app


@celery_app.task
def retrain_models():
    from app.ml.train import train
    from app.ml.train_anomaly import train as train_anomaly

    train()
    train_anomaly()
    return "Retraining complete"


@celery_app.task
def process_receipt_ocr(
    temp_image_path: str,
    cloudinary_folder: str = "expense-tracker/receipts",
):
    import cloudinary
    import cloudinary.uploader
    from app.ocr.parser import extract_text, parse_receipt
    from app.core.config import settings

    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
    )

    upload_result = cloudinary.uploader.upload(
        temp_image_path,
        folder=cloudinary_folder,
    )

    image_url = upload_result["secure_url"]

    raw_text, confidence = extract_text(temp_image_path)
    parsed = parse_receipt(raw_text)

    return {
        "image_url": image_url,
        "raw_ocr_text": raw_text,
        "parsed_confidence": confidence,
        "suggested_merchant": parsed["merchant"],
        "suggested_amount": parsed["total"],
        "suggested_date": (
            parsed["date"].isoformat()
            if parsed["date"]
            else None
        ),
    }