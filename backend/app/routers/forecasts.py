from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.category import Category
from app.schemas.forecast import ForecastOut
from app.services.forecast_service import get_forecast_for_category

router = APIRouter()


@router.get("/{category_id}", response_model=ForecastOut)
def get_forecast(category_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    return get_forecast_for_category(db, current_user.id, category_id)