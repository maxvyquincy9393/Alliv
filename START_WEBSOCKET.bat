@echo off
echo ========================================
echo   COLABMATCH WebSocket Chat - Quick Start
echo ========================================
echo.

REM Check if backend is running
echo [1/3] Checking backend...
powershell -Command "try { Invoke-WebRequest -Uri http://localhost:8000/health -TimeoutSec 2 -UseBasicParsing | Out-Null; Write-Host 'Backend is running!' -ForegroundColor Green } catch { Write-Host 'Backend NOT running. Starting...' -ForegroundColor Yellow; Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd backend; Write-Host \"Starting FastAPI with Socket.IO...\" -ForegroundColor Cyan; uvicorn app.main:socket_app --reload --host 0.0.0.0 --port 8000' }"

echo.
echo [2/3] Waiting for backend startup...
timeout /t 3 /nobreak >nul

REM Start frontend
echo [3/3] Starting frontend...
start powershell -NoExit -Command "cd frontend; Write-Host 'Starting Vite dev server...' -ForegroundColor Cyan; npm run dev"

echo.
echo ========================================
echo   Services Started!
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Press Ctrl+C in each window to stop
echo.
pause
