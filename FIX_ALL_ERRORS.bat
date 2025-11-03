@echo off
echo ========================================
echo FIXING ALL ERRORS - COLABMATCH
echo ========================================
echo.

echo [1/4] Fixing Python dependencies...
cd backend
python -m pip install --upgrade pip
python -m pip uninstall -y bcrypt passlib
python -m pip install bcrypt==4.1.2 passlib[bcrypt]==1.7.4 argon2-cffi
python -m pip install -r requirements.txt
python -m pip install -r requirements-test.txt

echo.
echo [2/4] Checking MongoDB...
docker ps | findstr alliv-mongo
if errorlevel 1 (
    echo Starting MongoDB...
    docker-compose up -d mongodb
)

echo.
echo [3/4] Running tests...
python -m pytest tests/unit/test_auth.py -v --tb=short

echo.
echo [4/4] All fixes applied!
echo.
echo To start backend: cd backend ^&^& python -m uvicorn app.main:app --reload --port 8000
echo To start frontend: cd frontend ^&^& npm run dev
echo.
pause
