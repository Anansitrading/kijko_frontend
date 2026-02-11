"""Celery application configuration for background task processing.

Usage:
    celery -A server.app.workers.celery_app worker --loglevel=info
    celery -A server.app.workers.celery_app beat --loglevel=info  (for periodic tasks)
"""

from celery import Celery
from celery.schedules import crontab

from server.app.config import settings

# Create Celery application
celery_app = Celery(
    "kijko-workers",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

# Configuration
celery_app.conf.update(
    # Serialization
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],

    # Timezone
    timezone="UTC",
    enable_utc=True,

    # Task settings
    task_track_started=True,
    task_time_limit=300,  # 5 min hard limit
    task_soft_time_limit=240,  # 4 min soft limit
    task_acks_late=True,
    worker_prefetch_multiplier=1,

    # Result settings
    result_expires=3600,  # 1 hour

    # Retry settings
    task_default_retry_delay=60,
    task_max_retries=3,

    # Periodic tasks (beat schedule)
    beat_schedule={
        "check-due-habits": {
            "task": "server.app.workers.tasks.check_due_habits_task",
            "schedule": crontab(minute="*/5"),  # Every 5 minutes
            "options": {"queue": "habits"},
        },
        "cleanup-old-executions": {
            "task": "server.app.workers.tasks.cleanup_old_executions_task",
            "schedule": crontab(hour=3, minute=0),  # Daily at 3 AM UTC
            "args": (90,),  # Keep 90 days
            "options": {"queue": "maintenance"},
        },
    },

    # Task routing
    task_routes={
        "server.app.workers.tasks.execute_skill_task": {"queue": "skills"},
        "server.app.workers.tasks.process_habit_task": {"queue": "habits"},
        "server.app.workers.tasks.process_reflex_task": {"queue": "reflexes"},
        "server.app.workers.tasks.cleanup_old_executions_task": {"queue": "maintenance"},
        "server.app.workers.tasks.check_due_habits_task": {"queue": "habits"},
    },
)

# Auto-discover tasks
celery_app.autodiscover_tasks(["server.app.workers"])
