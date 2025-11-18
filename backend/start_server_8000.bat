@echo off
REM Backend Server Startup Script for Windows
REM Starts the FastAPI server on port 8000

echo ========================================
echo Starting ALLIV Backend Server
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ and try again
    pause
    exit /b 1
)

echo [OK] Python found
echo.

REM Check if MongoDB is running
echo Checking MongoDB connection...
python -c "from pymongo import MongoClient; client = MongoClient('mongodb://localhost:27017/', serverSelectionTimeoutMS=2000); client.server_info(); print('[OK] MongoDB is running')" 2>nul
if %errorlevel% neq 0 (
    echo.
    echo WARNING: Cannot connect to MongoDB at mongodb://localhost:27017/
    echo Please ensure MongoDB is running before starting the server.
    echo.
    echo To start MongoDB:
    echo   - Windows Service: net start MongoDB
    echo   - Manual: mongod --dbpath C:\data\db
    echo.
    pause
)

echo.
echo Starting server on http://localhost:8000
echo Press CTRL+C to stop the server
echo ========================================
echo.

REM Change to backend directory and run server
cd /d "%~dp0"
python run_server_port8000.py

pause
