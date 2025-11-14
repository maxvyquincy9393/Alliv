@echo off
REM ==========================================
REM COLABMATCH - Stop All Services
REM ==========================================

echo.
echo Stopping all services...
echo.

REM Stop Docker containers
echo [1/3] Stopping MongoDB and Redis...
docker-compose down
echo [OK] Databases stopped

REM Find and kill backend process
echo.
echo [2/3] Stopping Backend Server...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8000" ^| find "LISTENING"') do (
    echo Killing process %%a
    taskkill /F /PID %%a >nul 2>&1
)
echo [OK] Backend stopped

REM Find and kill frontend process
echo.
echo [3/3] Stopping Frontend Server...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5173" ^| find "LISTENING"') do (
    echo Killing process %%a
    taskkill /F /PID %%a >nul 2>&1
)
echo [OK] Frontend stopped

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║              ALL SERVICES STOPPED                              ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
pause


