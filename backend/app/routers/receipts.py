import logging
import shutil, uuid, os
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException

from app.core.config import settings
from app.core.deps import get_current_user
from app.models.user import User
from app.services.receipt_service import scan_receipt_image

logger = logging.getLogger(__name__)

router = APIRouter()

UPLOAD_DIR = "/tmp/receipt_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/scan")
def scan_receipt(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    if file.content_type not in ("image/jpeg", "image/png", "image/jpg"):
        raise HTTPException(status_code=400, detail="Upload a JPEG or PNG image")

    if not (
        settings.cloudinary_cloud_name
        and settings.cloudinary_api_key
        and settings.cloudinary_api_secret
    ):
        # Fail fast with a clear message instead of a cryptic upload error.
        raise HTTPException(
            status_code=500,
            detail="Receipt scanning isn't configured on the server (Cloudinary credentials missing).",
        )

    # basename() guards against path traversal in the client-supplied filename.
    safe_name = os.path.basename(file.filename or "receipt.jpg")
    temp_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{safe_name}")
    try:
        with open(temp_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
        # Synchronous: upload -> OCR -> parse, result returned immediately.
        # No Celery worker needed.
        return scan_receipt_image(temp_path)
    except HTTPException:
        raise
    except Exception as exc:
        # Full traceback goes to the Render logs so the real cause is visible.
        logger.exception("Receipt scan failed")
        raise HTTPException(status_code=500, detail=f"Receipt scan failed: {exc}")
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
