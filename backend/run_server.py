#!/usr/bin/env python3
"""
Development server startup script.
Ensures proper Python path and environment setup.
"""
import os
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent.absolute()
sys.path.insert(0, str(backend_dir))

# Set default environment variables for development
os.environ.setdefault("NODE_ENV", "development")
os.environ.setdefault("MONGO_URI", "mongodb://127.0.0.1:27017/alliv_dev")
os.environ.setdefault("JWT_ACCESS_SECRET", "dev_jwt_access_secret_XXXXXXXXXXXXXXXXXXXXXXXX")
os.environ.setdefault("JWT_REFRESH_SECRET", "dev_jwt_refresh_secret_XXXXXXXXXXXXXXXXXXXXXXX")
os.environ.setdefault("REFRESH_TOKEN_FINGERPRINT_PEPPER", "dev_refresh_pepper_XXXXXXXXXXXXXXXXXXXXXXXX")
os.environ.setdefault("SENTRY_DSN", "")

# Import uvicorn and run the server
if __name__ == "__main__":
    import uvicorn
    
    # Use dev_main for development
    uvicorn.run(
        "app.dev_main:socket_app",
        host="127.0.0.1",
        port=8080,
        reload=True,
        reload_dirs=[str(backend_dir / "app")],
        log_level="info"
    )




