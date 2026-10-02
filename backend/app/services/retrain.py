"""Retrain the forecast + anomaly models.

Replaces the old Celery beat job (daily 3 AM). Called via FastAPI
BackgroundTasks after transaction changes, or manually through
POST /api/forecasts/retrain. Never raises: a training failure must
never break an API response.
"""
import logging

logger = logging.getLogger(__name__)


def retrain_models() -> str:
    try:
        from app.ml.train import train
        from app.ml.train_anomaly import train as train_anomaly

        train()
        train_anomaly()
        logger.info("Model retraining complete")
        return "Retraining complete"
    except Exception:
        logger.exception("Model retraining failed")
        return "Retraining failed"
