import sys
import os
from pathlib import Path

# Add backend to path
sys.path.insert(0, os.path.abspath("."))

try:
    print("Attempting to import app.main...")
    from app.main import app
    print("[SUCCESS] app.main imported successfully")
except Exception as e:
    print(f"[ERROR] Failed to import app.main: {e}")
    import traceback
    traceback.print_exc()
