"""
Quick CORS Test Script
Tests if the FastAPI server handles CORS correctly
"""

import requests
import json

def test_cors():
    """Test CORS preflight and actual request"""
    base_url = "http://localhost:8000"
    frontend_origin = "http://localhost:5173"
    
    print("=" * 60)
    print("CORS CONFIGURATION TEST")
    print("=" * 60)
    
    # Test 1: OPTIONS preflight request
    print("\n1. Testing OPTIONS preflight request...")
    print(f"   Endpoint: {base_url}/api/auth/login")
    print(f"   Origin: {frontend_origin}")
    
    try:
        response = requests.options(
            f"{base_url}/api/auth/login",
            headers={
                "Origin": frontend_origin,
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type,authorization",
            }
        )
        
        print(f"   Status: {response.status_code} {response.reason}")
        
        if response.status_code == 200:
            print("   ✅ Preflight request successful!")
            
            # Check CORS headers
            cors_headers = {
                "Access-Control-Allow-Origin": response.headers.get("Access-Control-Allow-Origin"),
                "Access-Control-Allow-Methods": response.headers.get("Access-Control-Allow-Methods"),
                "Access-Control-Allow-Headers": response.headers.get("Access-Control-Allow-Headers"),
                "Access-Control-Allow-Credentials": response.headers.get("Access-Control-Allow-Credentials"),
            }
            
            print("\n   CORS Headers Received:")
            for key, value in cors_headers.items():
                status = "✅" if value else "❌"
                print(f"   {status} {key}: {value}")
                
            # Verify critical headers
            if cors_headers["Access-Control-Allow-Origin"] == frontend_origin:
                print(f"\n   ✅ Origin {frontend_origin} is allowed")
            else:
                print(f"\n   ❌ Origin not properly configured")
                
            if cors_headers["Access-Control-Allow-Credentials"] == "true":
                print("   ✅ Credentials are allowed")
            else:
                print("   ❌ Credentials not allowed")
                
        else:
            print(f"   ❌ Preflight request failed!")
            print(f"   Response: {response.text[:200]}")
            
    except requests.exceptions.ConnectionError:
        print("   ❌ Connection Error: Is the server running on port 8000?")
        print("   Run: python run_server.py")
        return False
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        return False
    
    # Test 2: Actual POST request (will fail with 401, but should work with CORS)
    print("\n2. Testing actual POST request...")
    print(f"   Endpoint: {base_url}/api/auth/login")
    
    try:
        response = requests.post(
            f"{base_url}/api/auth/login",
            json={"email": "test@example.com", "password": "testpassword"},
            headers={
                "Origin": frontend_origin,
                "Content-Type": "application/json",
            }
        )
        
        print(f"   Status: {response.status_code} {response.reason}")
        
        # Check if CORS headers are present
        cors_origin = response.headers.get("Access-Control-Allow-Origin")
        if cors_origin:
            print(f"   ✅ CORS headers present in response")
            print(f"   Access-Control-Allow-Origin: {cors_origin}")
        else:
            print(f"   ❌ CORS headers missing in response")
            
        # 401 is expected (wrong credentials), but CORS should work
        if response.status_code in [401, 400]:
            print("   ✅ Request reached the server (expected 401/400 for invalid credentials)")
        else:
            print(f"   Response: {response.text[:200]}")
            
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        return False
    
    # Test 3: Health check
    print("\n3. Testing health endpoint...")
    try:
        response = requests.get(
            f"{base_url}/api/health",
            headers={"Origin": frontend_origin}
        )
        
        print(f"   Status: {response.status_code} {response.reason}")
        
        if response.status_code == 200:
            print("   ✅ Server is healthy!")
            data = response.json()
            print(f"   Response: {json.dumps(data, indent=2)}")
        else:
            print(f"   ❌ Health check failed")
            
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        return False
    
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print("If all tests passed, CORS is properly configured!")
    print("You can now use the login form in the frontend.")
    print("=" * 60)
    
    return True

if __name__ == "__main__":
    test_cors()
