"""
Quick test script to verify login endpoint
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_options_request():
    """Test if OPTIONS request works (CORS preflight)"""
    print("\n=== Testing OPTIONS Request (CORS Preflight) ===")
    try:
        response = requests.options(
            f"{BASE_URL}/api/auth/login",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type",
            }
        )
        print(f"Status Code: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print("✅ OPTIONS request successful - CORS is working!")
        else:
            print(f"❌ OPTIONS request failed with {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_login_with_email():
    """Test login with email (correct format)"""
    print("\n=== Testing Login with Email ===")
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "user@example.com",
                "password": "password123",
                "remember_me": False
            },
            headers={
                "Content-Type": "application/json",
                "Origin": "http://localhost:5173"
            }
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Login successful!")
        elif response.status_code == 401:
            print("⚠️  Credentials invalid (expected if user doesn't exist)")
        else:
            print(f"❌ Login failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_login_with_username():
    """Test login with username (wrong format - should fail)"""
    print("\n=== Testing Login with Username (Should Fail) ===")
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "username": "test",  # Wrong field name
                "password": "test"
            },
            headers={
                "Content-Type": "application/json",
                "Origin": "http://localhost:5173"
            }
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 422:
            print("✅ Correctly rejected - backend expects 'email' field")
        else:
            print(f"⚠️  Unexpected response: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("=" * 60)
    print("Login Endpoint Test Suite")
    print("=" * 60)
    print("Make sure your FastAPI server is running on http://localhost:8000")
    print()
    
    test_options_request()
    test_login_with_email()
    test_login_with_username()
    
    print("\n" + "=" * 60)
    print("Test Complete")
    print("=" * 60)
