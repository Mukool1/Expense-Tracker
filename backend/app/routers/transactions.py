from datetime import date
from typing import cast
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.models.category import Category
from app.ml.predict_anomaly import check_anomaly
from app.database.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionOut, TransactionCreate
from app.services.retrain import retrain_models

router = APIRouter()

# Anomaly detection needs a baseline to compare against. With only a handful
# of transactions there is no "normal" yet, and scoring against the global
# model would flag nearly everything — so we don't score until the user has
# enough of their own history.
MIN_TXNS_FOR_ANOMALY = 10


def _maybe_flag_anomaly(db: Session, tx: Transaction) -> bool:
    """Score one transaction for anomaly. Returns True if it was scored."""
    user_tx_count = (
        db.query(Transaction).filter(Transaction.user_id == tx.user_id).count()
    )
    if user_tx_count < MIN_TXNS_FOR_ANOMALY:
        return False
    category = db.query(Category).filter(Category.id == tx.category_id).first()
    try:
        result = check_anomaly(float(tx.amount), category.name, tx.transaction_date)
    except FileNotFoundError:
        return False  # model hasn't been trained yet — skip quietly
    tx.is_anomaly = result["is_anomaly"]
    tx.anomaly_score = result["anomaly_score"]
    db.commit()
    db.refresh(tx)
    return True


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
def create_transaction(
    tx_in: TransactionCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tx = Transaction(user_id=current_user.id, **tx_in.model_dump())
    db.add(tx)
    db.commit()
    db.refresh(tx)

    _maybe_flag_anomaly(db, tx)

    # Retrain in the background after the response is sent (replaces celery beat).
    background_tasks.add_task(retrain_models)
    return tx


@router.post("/recheck-anomalies")
def recheck_anomalies(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Re-run anomaly detection over the current user's transactions.

    Clears bogus flags for users with too little history to judge, and
    re-scores everyone else. Useful after the minimum-history gate was added.
    """
    txns = (
        db.query(Transaction)
        .filter(Transaction.user_id == current_user.id)
        .order_by(Transaction.id)
        .all()
    )
    cleared = rescored = 0
    if len(txns) < MIN_TXNS_FOR_ANOMALY:
        for tx in txns:
            tx.is_anomaly = False
            tx.anomaly_score = None
            cleared += 1
        db.commit()
    else:
        for tx in txns:
            if _maybe_flag_anomaly(db, tx):
                rescored += 1
    return {"total": len(txns), "cleared": cleared, "rescored": rescored}


@router.delete("/{transaction_id}", status_code=204)
def delete_transaction(
    transaction_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if cast(int, tx.user_id) != cast(int, current_user.id):
        raise HTTPException(status_code=403, detail="Not your transaction")
    db.delete(tx)
    db.commit()
    background_tasks.add_task(retrain_models)