# Starting the Backend Server

## Quick Start (Recommended)

### Windows
```bash
cd backend
python run_server.py
```

Or double-click `start_server.bat`

### Linux/Mac
```bash
cd backend
chmod +x start_server.sh
./start_server.sh
```

Or:
```bash
cd backend
python run_server.py
```

## Alternative Methods

## API Prefix & Hot Reload

- Semua endpoint REST sekarang berada di bawah prefix `/api`. Contoh:
  - `POST /api/auth/login`
  - `GET /api/discover/online`
- Pastikan frontend (Vite) menggunakan `VITE_API_URL=http://localhost:8080/api`.
- Jika kamu mengubah daftar router di `app/main.py`, **restart server** sepenuhnya (Ctrl+C lalu jalankan lagi `python run_server.py`). Perubahan prefix routing tidak selalu terdeteksi oleh hot reload.

### Method 1: Using uvicorn directly (from backend directory)
```bash
cd backend
uvicorn app.dev_main:socket_app --host 127.0.0.1 --port 8080 --reload
```

### Method 2: Using uvicorn with PYTHONPATH
```bash
cd backend
set PYTHONPATH=%CD% && uvicorn app.dev_main:socket_app --host 127.0.0.1 --port 8080 --reload
```

On Linux/Mac:
```bash
cd backend
PYTHONPATH=. uvicorn app.dev_main:socket_app --host 127.0.0.1 --port 8080 --reload
```

### Method 3: Using FastAPI app directly (without SocketIO)
```bash
cd backend
uvicorn app.main:app --host 127.0.0.1 --port 8080 --reload
```

> **Tip:** The module path you pass to uvicorn depends on the directory you point `--app-dir` to.  
> • If you're inside `backend/`, use `uvicorn app.main:app --reload`. (No extra `--app-dir` needed.)  
> • If you really want `--app-dir`, make sure it points to the directory *containing* `main.py`. For example:
>   - `uvicorn main:app --app-dir app --reload` (when you're already in `backend/`)
>   - `uvicorn app.main:app --app-dir backend --reload` (when you run from the repo root)

## Troubleshooting

### Error: `ModuleNotFoundError: No module named 'app'`

**Solution**: Make sure you're running the command from the `backend` directory **or** set the correct `--app-dir` when launching uvicorn.

✅ From the backend directory:
```bash
cd backend
python run_server.py
```

✅ If you prefer uvicorn directly from `backend/`:
```bash
uvicorn app.main:app --host 127.0.0.1 --port 8080 --reload
```

✅ If you insist on passing `--app-dir`, match the module path:
```bash
# Example from backend/
uvicorn main:app --app-dir app --reload

# Example from repo root
uvicorn app.main:app --app-dir backend --reload
```

### Error: Import errors or missing dependencies

**Solution**: Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

### Error: Port already in use

**Solution**: Change the port in `run_server.py` or use a different port:
```bash
uvicorn app.dev_main:socket_app --host 127.0.0.1 --port 8081 --reload
```

## Environment Variables

The server will use these default values if not set:
- `NODE_ENV=development`
- `MONGO_URI=mongodb://127.0.0.1:27017/alliv_dev`
- `JWT_ACCESS_SECRET=dev_jwt_access_secret_...`
- `JWT_REFRESH_SECRET=dev_jwt_refresh_secret_...`

Create a `.env` file in the `backend` directory to override these values.

