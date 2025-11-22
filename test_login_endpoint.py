"""
Quick test script to verify login endpoint is working
"""
import requests
import json

# Test the login endpoint
url = "http://localhost:8080/api/auth/login"
headers = {
    "Content-Type": "application/json",
    "Origin": "http://localhost:5173"
}

# Test data
data = {
    "email": "test@example.com",
    "password": "Test1234"
}

print(f"Testing POST {url}")
print(f"Headers: {json.dumps(headers, indent=2)}")
print(f"Data: {json.dumps(data, indent=2)}")
print("\n" + "="*50 + "\n")

try:
    response = requests.post(url, json=data, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    print(f"Response Body: {response.text}")
except Exception as e:
    print(f"Error: {e}")







