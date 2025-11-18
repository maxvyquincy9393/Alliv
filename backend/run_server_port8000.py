#!/usr/bin/env python3
"""
Development server startup script for port 8000.
Ensures proper Python path and environment setup.
"""
import os
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent.absolute()
sys.path.insert(0, str(backend_dir))

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

# Import uvicorn and run the server
if __name__ == "__main__":
    import uvicorn
    
    # Use dev_main for development
    uvicorn.run(
        "app.dev_main:socket_app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_dirs=[str(backend_dir / "app")],
        log_level="info"
    )
