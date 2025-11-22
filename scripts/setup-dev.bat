@echo off
REM ==============================================================================
REM Development Environment Setup Script (Windows)
REM ==============================================================================
REM This script automates the setup of the COLABMATCH development environment
REM ==============================================================================

echo.
echo 🚀 COLABMATCH Development Environment Setup
echo ============================================
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js not found. Please install Node.js ^>= 18
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION%

REM Check Python
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Python not found. Please install Python ^>= 3.11
    exit /b 1
)
for /f "tokens=*" %%i in ('python --version') do set PYTHON_VERSION=%%i
echo ✅ %PYTHON_VERSION%

REM Check Docker (optional)
where docker >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%i in ('docker --version') do set DOCKER_VERSION=%%i
    echo ✅ Docker found: %DOCKER_VERSION%
) else (
    echo ⚠️  Docker not found (optional for local development)
)

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

REM Setup Backend
echo 🐍 Setting up Backend...
echo.

cd backend

REM Create virtual environment
if not exist ".venv" (
    echo Creating Python virtual environment...
    python -m venv .venv
    echo ✅ Virtual environment created
) else (
    echo ✅ Virtual environment already exists
)

REM Activate virtual environment
echo Activating virtual environment...
call .venv\Scripts\activate.bat

REM Install dependencies
echo Installing Python dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt
pip install -r requirements-test.txt
if %ERRORLEVEL% NEQ 0 (
    pip install pytest pytest-asyncio black ruff flake8
)
echo ✅ Python dependencies installed

REM Setup environment file
if not exist ".env" (
    echo Creating .env file from template...
    copy ..\env.example .env
    
    REM Generate secure secrets
    if exist "generate_secrets.py" (
        echo Generating secure JWT secrets...
        python generate_secrets.py
        echo ✅ Secure secrets generated
    )
    
    echo ✅ .env file created
    echo ⚠️  Please edit .env file and configure your database and other settings
) else (
    echo ✅ .env file already exists
)

cd ..

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

REM Setup Frontend
echo ⚛️  Setting up Frontend...
echo.

cd frontend

REM Install dependencies
echo Installing Node.js dependencies...
call npm install
echo ✅ Node.js dependencies installed

REM Setup environment file
if not exist ".env" (
    echo Creating .env file from template...
    copy env.example .env
    echo ✅ .env file created
    echo ⚠️  Please edit .env file and configure your API URL
) else (
    echo ✅ .env file already exists
)

REM Setup Husky
echo Setting up pre-commit hooks...
call npm run prepare
echo ✅ Pre-commit hooks configured

cd ..

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

REM Final instructions
echo ✨ Setup Complete!
echo.
echo 📝 Next Steps:
echo.
echo 1. Configure your environment files:
echo    - backend\.env
echo    - frontend\.env
echo.
echo 2. Start MongoDB and Redis (if running locally):
echo    docker-compose up mongo redis -d
echo.
echo 3. Start the development servers:
echo.
echo    Terminal 1 (Backend):
echo    cd backend
echo    .venv\Scripts\activate
echo    uvicorn app.main:socket_app --reload --port 8080
echo.
echo    Terminal 2 (Frontend):
echo    cd frontend
echo    npm run dev
echo.
echo 4. Access the application:
echo    Frontend: http://localhost:5173
echo    Backend:  http://localhost:8080
echo    API Docs: http://localhost:8080/docs
echo.
echo Happy coding! 🚀
echo.

pause






