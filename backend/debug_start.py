
import sys
import traceback
try:
    from app.main import socket_app
    print("Import successful")
except Exception:
    with open("error.txt", "w") as f:
        traceback.print_exc(file=f)
    print("Error written to error.log")
