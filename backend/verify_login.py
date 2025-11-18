import requests
import sys
import time

BASE_URL = "http://localhost:8000"

def verify_login():
    print("Waiting for server...")
    for _ in range(10):
        try:
            requests.get(f"{BASE_URL}/health")
            break
        except:
            time.sleep(1)
    else:
        print("Server not ready")
        sys.exit(1)

    print("Server ready. Attempting login...")
    
    login_data = {
        "email": "aulia@dev.com",
        "password": "pass123"
    }
    
    try:
        resp = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        print(f"Login Status: {resp.status_code}")
        print(f"Response: {resp.text}")
        
        if resp.status_code == 200:
            print("[SUCCESS] Login successful!")
            token = resp.json().get("accessToken")
            print(f"Token received: {token[:20]}...")
        else:
            print("[FAILED] Login failed.")
            sys.exit(1)
            
    except Exception as e:
        print(f"[ERROR] {e}")
        sys.exit(1)

if __name__ == "__main__":
    verify_login()
