from celery import Celery
from celery.schedules import crontab

from app.core.config import settings

celery_app = Celery(
    "expense_tracker",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.tasks.ml_tasks"],  # tells Celery which modules contain tasks
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="Asia/Kolkata",
    enable_utc=True,
    broker_connection_retry_on_startup=True,  # silences the warning, sets explicit future-proof behavior
)

# Scheduled ("periodic") tasks — Celery's cron-like scheduler
celery_app.conf.beat_schedule = {
    "retrain-models-daily": {
        "task": "app.tasks.ml_tasks.retrain_models",
        "schedule": crontab(hour=3, minute=0),  # 3:00 AM daily — low-traffic hours
    },
}