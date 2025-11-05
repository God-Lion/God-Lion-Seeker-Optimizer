import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from src.models.user import User
import pyotp

@pytest.mark.asyncio
async def test_mfa_setup(client: AsyncClient, test_user: User, db: AsyncSession):
    # Log in the user to get a valid token
    login_data = {"username": test_user.email, "password": "testpassword"}
    response = await client.post("/api/auth/login", data=login_data)
    token = response.json()["token"]

    # Set up MFA
    headers = {"Authorization": f"Bearer {token}"}
    response = await client.post("/api/auth/mfa/setup", headers=headers)
    assert response.status_code == 200
    assert "qr_code" in response.json()
    assert "recovery_codes" in response.json()

@pytest.mark.asyncio
async def test_mfa_verify(client: AsyncClient, test_user: User, db: AsyncSession):
    # Log in the user to get a valid token
    login_data = {"username": test_user.email, "password": "testpassword"}
    response = await client.post("/api/auth/login", data=login_data)
    token = response.json()["token"]

    # Set up MFA
    headers = {"Authorization": f"Bearer {token}"}
    response = await client.post("/api/auth/mfa/setup", headers=headers)
    assert response.status_code == 200

    # Get the MFA secret from the user model
    user = await db.get(User, test_user.id)
    mfa_secret = user.mfa_secret

    # Generate a valid TOTP code
    totp = pyotp.TOTP(mfa_secret)
    code = totp.now()

    # Verify MFA
    response = await client.post("/api/auth/mfa/verify", headers=headers, json={"code": code})
    assert response.status_code == 200
    assert response.json()["message"] == "MFA enabled successfully."

@pytest.mark.asyncio
async def test_mfa_disable(client: AsyncClient, test_user: User, db: AsyncSession):
    # Log in the user and enable MFA
    login_data = {"username": test_user.email, "password": "testpassword"}
    response = await client.post("/api/auth/login", data=login_data)
    token = response.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    await client.post("/api/auth/mfa/setup", headers=headers)
    user = await db.get(User, test_user.id)
    mfa_secret = user.mfa_secret
    totp = pyotp.TOTP(mfa_secret)
    code = totp.now()
    await client.post("/api/auth/mfa/verify", headers=headers, json={"code": code})


    # Disable MFA
    response = await client.post("/api/auth/mfa/disable", headers=headers)
    assert response.status_code == 200
    assert response.json()["message"] == "MFA disabled successfully."

@pytest.mark.asyncio
async def test_login_with_mfa(client: AsyncClient, test_user: User, db: AsyncSession):
    # Enable MFA for the user
    login_data = {"username": test_user.email, "password": "testpassword"}
    response = await client.post("/api/auth/login", data=login_data)
    token = response.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    await client.post("/api/auth/mfa/setup", headers=headers)
    user = await db.get(User, test_user.id)
    mfa_secret = user.mfa_secret
    totp = pyotp.TOTP(mfa_secret)
    code = totp.now()
    await client.post("/api/auth/mfa/verify", headers=headers, json={"code": code})

    # Log in again
    response = await client.post("/api/auth/login", data=login_data)
    assert response.status_code == 200
    assert response.json() == {"mfa_required": True}
