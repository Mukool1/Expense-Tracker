from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.category import Category
from app.schemas.forecast import ForecastOut
from app.services.forecast_service import get_forecast_for_category
from app.services.retrain import retrain_models

router = APIRouter()


@router.post("/retrain")
def retrain(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
):
    """Manually kick off model retraining (replaces the old celery beat schedule)."""
    background_tasks.add_task(retrain_models)
    return {"status": "retraining started"}


@router.get("/{category_id}", response_model=ForecastOut)
def get_forecast(category_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    return get_forecast_for_category(db, current_user.id, category_id)
