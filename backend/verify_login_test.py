import requests
import json

url = "http://localhost:8080/auth/login"
payload = {
    "email": "sarah@demo.com",
    "password": "Demo123!"
}
headers = {
    "Content-Type": "application/json"
}

try:
    response = requests.post(url, json=payload, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
