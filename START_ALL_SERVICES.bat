@echo off
REM ==========================================
REM COLABMATCH - Start All Services
REM Perfect Quality - Senior Engineer Edition
REM ==========================================

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║         COLABMATCH - Starting All Services                     ║
echo ║         Senior Engineer - Perfect Quality Edition              ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Check if Docker Desktop is running
echo [1/5] Checking Docker Desktop...
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Docker Desktop is not running!
    echo.
    echo Please start Docker Desktop first:
    echo   1. Open Docker Desktop from Start Menu
    echo   2. Wait for it to fully start (whale icon in system tray)
    echo   3. Run this script again
    echo.
    echo OR use local MongoDB installation:
    echo   mongod --dbpath C:\data\db
    echo.
    pause
    exit /b 1
)
echo [OK] Docker Desktop is running

REM Start MongoDB and Redis
echo.
echo [2/5] Starting MongoDB and Redis...
docker-compose up -d mongo redis
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start databases
    pause
    exit /b 1
)
echo [OK] Databases started

REM Wait for MongoDB to be ready
echo.
echo [3/5] Waiting for MongoDB to be ready...
timeout /t 5 /nobreak >nul
echo [OK] MongoDB should be ready

REM Start Backend
echo.
echo [4/5] Starting Backend Server...
echo.
echo Opening new terminal for backend...
start "COLABMATCH Backend" cmd /k "cd backend && echo [BACKEND] Starting FastAPI server... && uvicorn app.main:app --reload --port 8000"

REM Wait a bit for backend to start
timeout /t 3 /nobreak >nul

REM Start Frontend
echo.
echo [5/5] Starting Frontend Server...
echo.
echo Opening new terminal for frontend...
start "COLABMATCH Frontend" cmd /k "cd frontend && echo [FRONTEND] Starting Vite dev server... && npm run dev"

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                 ALL SERVICES STARTED!                          ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo Services Status:
echo   [OK] MongoDB       : mongodb://localhost:27017/alliv
echo   [OK] Redis         : redis://localhost:6379
echo   [OK] Backend API   : http://localhost:8000
echo   [OK] Frontend      : http://localhost:5173
echo.
echo API Documentation:
echo   OpenAPI Docs  : http://localhost:8000/docs
echo   ReDoc        : http://localhost:8000/redoc
echo   Health Check  : http://localhost:8000/health
echo.
echo Frontend URL:
echo   Main App      : http://localhost:5173
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║              READY FOR TESTING!                                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo Press any key to open browser...
pause >nul

REM Open browser
start http://localhost:5173
start http://localhost:8000/docs

echo.
echo Browser opened! Start testing all features.
echo.
echo To stop all services, run: STOP_ALL_SERVICES.bat
echo.
pause


