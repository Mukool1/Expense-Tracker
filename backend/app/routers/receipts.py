import shutil, uuid, os
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from celery.result import AsyncResult

from app.core.deps import get_current_user
from app.models.user import User
from app.tasks.ml_tasks import process_receipt_ocr
from app.tasks.celery_app import celery_app

router = APIRouter()

UPLOAD_DIR = "/tmp/receipt_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/scan")
def scan_receipt(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    if file.content_type not in ("image/jpeg", "image/png", "image/jpg"):
        raise HTTPException(status_code=400, detail="Upload a JPEG or PNG image")

    temp_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")
    with open(temp_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    task = process_receipt_ocr.delay(temp_path)
    return {"task_id": task.id}


@router.get("/scan/{task_id}")
def get_scan_result(task_id: str, current_user: User = Depends(get_current_user)):
    result = AsyncResult(task_id, app=celery_app)
    if result.state == "PENDING":
        return {"status": "processing"}
    elif result.state == "SUCCESS":
        return {"status": "done", "result": result.result}
    else:
        return {"status": "failed", "error": str(result.info)}