"""
Integrations package
"""
from .sentry import init_sentry, capture_exception, capture_message
from .captcha import (
    verify_recaptcha,
    verify_hcaptcha,
    require_captcha,
    CaptchaError,
)
from .metrics import (
    init_metrics,
    PrometheusMiddleware,
    record_db_query,
    record_user_registration,
    record_match_created,
    record_match_accepted,
    record_message_sent,
    increment_active_users,
    decrement_active_users,
    set_active_users,
    increment_websocket_connections,
    decrement_websocket_connections,
)

__all__ = [
    "init_sentry",
    "capture_exception",
    "capture_message",
    "verify_recaptcha",
    "verify_hcaptcha",
    "require_captcha",
    "CaptchaError",
    "init_metrics",
    "PrometheusMiddleware",
    "record_db_query",
    "record_user_registration",
    "record_match_created",
    "record_match_accepted",
    "record_message_sent",
    "increment_active_users",
    "decrement_active_users",
    "set_active_users",
    "increment_websocket_connections",
    "decrement_websocket_connections",
]
