"""
Celery application for background tasks.

Handles:
- Email sending
- Report generation
- Data processing
- Scheduled tasks
"""
from celery import Celery
from celery.schedules import crontab
from .config import settings

# Create Celery instance
celery_app = Celery(
    "colabmatch",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=[
        "app.tasks.email",
        "app.tasks.reports",
        "app.tasks.processing",
    ]
)

# Celery configuration
celery_app.conf.update(
    # Task settings
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    
    # Task execution
    task_track_started=True,
    task_time_limit=300,  # 5 minutes hard limit
    task_soft_time_limit=240,  # 4 minutes soft limit
    task_acks_late=True,  # Acknowledge after task completion
    task_reject_on_worker_lost=True,
    
    # Result backend
    result_expires=3600,  # Results expire after 1 hour
    result_backend_transport_options={
        'master_name': 'mymaster',
    },
    
    # Worker settings
    worker_prefetch_multiplier=1,  # One task at a time
    worker_max_tasks_per_child=1000,  # Restart worker after 1000 tasks
    
    # Rate limiting
    task_default_rate_limit='100/m',
    
    # Retry settings
    task_default_retry_delay=60,  # Retry after 60 seconds
    task_max_retries=3,
    
    # Beat schedule (periodic tasks)
    beat_schedule={
        'cleanup-expired-tokens': {
            'task': 'app.tasks.processing.cleanup_expired_tokens',
            'schedule': crontab(hour=2, minute=0),  # Run at 2 AM daily
        },
        'generate-daily-stats': {
            'task': 'app.tasks.reports.generate_daily_stats',
            'schedule': crontab(hour=1, minute=0),  # Run at 1 AM daily
        },
        'send-digest-emails': {
            'task': 'app.tasks.email.send_digest_emails',
            'schedule': crontab(hour=8, minute=0),  # Run at 8 AM daily
        },
    },
)

# Task routes (send specific tasks to specific queues)
celery_app.conf.task_routes = {
    'app.tasks.email.*': {'queue': 'emails'},
    'app.tasks.reports.*': {'queue': 'reports'},
    'app.tasks.processing.*': {'queue': 'processing'},
}

# Autodiscover tasks in modules
celery_app.autodiscover_tasks([
    'app.tasks.email',
    'app.tasks.reports',
    'app.tasks.processing',
])


if __name__ == '__main__':
    celery_app.start()
