import requests
import time
import sys

BASE_URL = "http://localhost:8001"

def run_test():
    print("Waiting for server...")
    for _ in range(10):
        try:
            requests.get(f"{BASE_URL}/health")
            break
        except:
            time.sleep(1)
    else:
        print("Server not ready")
        return

    print("Server ready. Starting test.")

    # 1. Register
    user_a = {
        "email": "alice_test@example.com",
        "password": "Password123!",
        "name": "Alice Test"
    }
    resp = requests.post(f"{BASE_URL}/auth/register", json=user_a)
    print(f"Register: {resp.status_code} {resp.text}")
    if resp.status_code != 201:
        sys.exit(1)
    
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Profile
    resp = requests.get(f"{BASE_URL}/profile/me", headers=headers)
    print(f"Get Profile: {resp.status_code}")
    if resp.status_code != 200:
        sys.exit(1)

    # 3. Feed
    post = {
        "type": "update",
        "content": {"text": "Hello World"},
        "visibility": "public"
    }
    resp = requests.post(f"{BASE_URL}/api/feed/", json=post, headers=headers)
    print(f"Create Post: {resp.status_code} {resp.text}")
    if resp.status_code != 200:
        sys.exit(1)

    print("SUCCESS")

if __name__ == "__main__":
    run_test()
