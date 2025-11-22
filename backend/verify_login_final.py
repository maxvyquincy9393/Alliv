import requests
import json

url = "http://localhost:8000/auth/login"
headers = {"Content-Type": "application/json"}
data = {
    "email": "aulia@dev.com",
    "password": "pass123"
}

try:
    response = requests.post(url, headers=headers, json=data)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print("Login Successful!")
        print(json.dumps(response.json(), indent=2))
    else:
        print("Login Failed")
        print(response.text)
except Exception as e:
    print(f"Error: {e}")
