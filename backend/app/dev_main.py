"""Development entrypoint that provides safe defaults for missing env vars.

This file sets minimal environment variables required by `config_validated`
so the app can start in development without a real MongoDB or production
secrets. It then exposes the `socket_app` ASGI app from `app.main` so
uvicorn can load `app.dev_main:socket_app`.
"""
import os

# Minimal safe defaults for local development — override with real .env if available
os.environ.setdefault("NODE_ENV", "development")
os.environ.setdefault("MONGO_URI", "mongodb://127.0.0.1:27017/alliv_dev")
os.environ.setdefault("JWT_ACCESS_SECRET", "dev_jwt_access_secret_XXXXXXXXXXXXXXXXXXXXXXXX")
os.environ.setdefault("JWT_REFRESH_SECRET", "dev_jwt_refresh_secret_XXXXXXXXXXXXXXXXXXXXXXX")
os.environ.setdefault("REFRESH_TOKEN_FINGERPRINT_PEPPER", "dev_refresh_pepper_XXXXXXXXXXXXXXXXXXXXXXXX")
os.environ.setdefault("SENTRY_DSN", "")

# Import the main app after env vars are present so settings validate correctly
from .main import socket_app  # noqa: E402,F401

# Expose ASGI app
__all__ = ["socket_app"]
