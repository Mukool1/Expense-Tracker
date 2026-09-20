from fastapi import APIRouter, Depends, HTTPException
from typing import cast

from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryOut

router = APIRouter()


@router.get("/", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # a user should see: global defaults (user_id is NULL) + their own custom ones
    return db.query(Category).filter(
        or_(Category.user_id == current_user.id, Category.user_id.is_(None))
    ).all()


@router.post("/", response_model=CategoryOut, status_code=201)
def create_category(cat_in: CategoryCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    category = Category(name=cat_in.name, user_id=current_user.id, is_default=False)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.delete("/{category_id}", status_code=204)
def delete_category(category_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    if cast(int, category.user_id) != cast(int, current_user.id):
        raise HTTPException(status_code=403, detail="Not your category")
    db.delete(category)
    db.commit()