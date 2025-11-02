@echo off
echo ========================================
echo ALLIV Backend Startup
echo ========================================

REM Start backend with MongoDB
echo.
echo Starting FastAPI backend with MongoDB...
cd /d %~dp0backend
python -m uvicorn app.main:app --reload --port 8000

pause
