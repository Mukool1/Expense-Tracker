from datetime import date
from typing import cast

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.database.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransactionOut

router = APIRouter()


@router.get("/", response_model=list[TransactionOut])
def list_transactions(
    category_id: int | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Transaction).options(joinedload(Transaction.category)).filter(
        Transaction.user_id == current_user.id
    )
    if category_id:
        query = query.filter(Transaction.category_id == category_id)
    if date_from:
        query = query.filter(Transaction.transaction_date >= date_from)
    if date_to:
        query = query.filter(Transaction.transaction_date <= date_to)

    return query.order_by(Transaction.transaction_date.desc()).offset((page - 1) * limit).limit(limit).all()


@router.post("/", response_model=TransactionOut, status_code=201)
def create_transaction(tx_in: TransactionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tx = Transaction(user_id=current_user.id, **tx_in.model_dump())
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx


@router.delete("/{transaction_id}", status_code=204)
def delete_transaction(transaction_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if cast(int, tx.user_id) != cast(int, current_user.id):
        raise HTTPException(status_code=403, detail="Not your transaction")
    db.delete(tx)
    db.commit()