@echo off
echo ========================================
echo   ALLIV - Complete System Startup
echo ========================================
echo.

REM Check if MongoDB container exists
docker ps -a | findstr "alliv-mongo" >nul
if %errorlevel% equ 0 (
    echo [1/3] Starting MongoDB container...
    docker start alliv-mongo
) else (
    echo [1/3] Creating MongoDB container...
    docker run -d -p 27017:27017 --name alliv-mongo mongo:7
)

echo.
echo [2/3] Waiting for MongoDB to be ready...
timeout /t 3 /nobreak >nul

echo.
echo [3/3] Starting Backend API...
cd backend
start "Alliv Backend" cmd /k "uvicorn app.main:app --reload --port 8000"

cd..
echo.
echo ========================================
echo   ALLIV System Started!
echo ========================================
echo.
echo - MongoDB: running on port 27017
echo - Backend API: http://localhost:8000
echo - API Docs: http://localhost:8000/docs
echo.
echo Press any key to open API documentation...
pause >nul
start http://localhost:8000/docs
