"""Unit tests for authentication module"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timedelta
import jwt


class TestAuthDependencies:
    """Test authentication dependencies"""
    
    @pytest.fixture
    def auth_deps(self):
        """Create auth dependencies"""
        from auth.dependencies import get_current_user
        return get_current_user
    
    def test_dependencies_exist(self, auth_deps):
        """Test auth dependencies exist"""
        assert auth_deps is not None


class TestGoogleSSOAuth:
    """Test Google SSO authentication"""
    
    @pytest.fixture
    def google_auth(self):
        """Create Google auth instance"""
        from auth.google_sso_auth import GoogleSSO
        return GoogleSSO(
            client_id="test_client_id",
            client_secret="test_client_secret",
            redirect_uri="http://localhost:8000/auth/callback"
        )
    
    def test_google_auth_initialization(self, google_auth):
        """Test Google auth initialization"""
        assert google_auth is not None
        assert hasattr(google_auth, 'client_id')
    
    def test_get_authorization_url(self, google_auth):
        """Test getting authorization URL"""
        url = google_auth.get_authorization_url()
        
        assert isinstance(url, str)
        assert "google" in url.lower() or "oauth" in url.lower()
    
    @pytest.mark.asyncio
    async def test_exchange_code_for_token(self, google_auth):
        """Test exchanging authorization code for token"""
        with patch('aiohttp.ClientSession.post') as mock_post:
            mock_response = MagicMock()
            mock_response.json = AsyncMock(return_value={
                "access_token": "test_token",
                "id_token": "test_id_token"
            })
            mock_post.return_value.__aenter__.return_value = mock_response
            
            token = await google_auth.exchange_code("test_code")
            
            assert token is not None
    
    @pytest.mark.asyncio
    async def test_get_user_info(self, google_auth):
        """Test getting user info from Google"""
        with patch('aiohttp.ClientSession.get') as mock_get:
            mock_response = MagicMock()
            mock_response.json = AsyncMock(return_value={
                "email": "test@example.com",
                "name": "Test User",
                "picture": "https://example.com/photo.jpg"
            })
            mock_get.return_value.__aenter__.return_value = mock_response
            
            user_info = await google_auth.get_user_info("test_token")
            
            assert user_info is not None
            assert "email" in user_info


class TestJWTTokens:
    """Test JWT token handling"""
    
    @pytest.fixture
    def jwt_handler(self):
        """Create JWT handler"""
        from auth.jwt_handler import JWTHandler
        return JWTHandler(secret_key="test_secret", algorithm="HS256")
    
    def test_create_access_token(self, jwt_handler):
        """Test creating access token"""
        data = {"user_id": 1, "email": "test@example.com"}
        
        token = jwt_handler.create_access_token(data)
        
        assert isinstance(token, str)
        assert len(token) > 0
    
    def test_decode_access_token(self, jwt_handler):
        """Test decoding access token"""
        data = {"user_id": 1, "email": "test@example.com"}
        token = jwt_handler.create_access_token(data)
        
        decoded = jwt_handler.decode_token(token)
        
        assert decoded is not None
        assert decoded["user_id"] == 1
    
    def test_token_expiration(self, jwt_handler):
        """Test token expiration"""
        data = {"user_id": 1}
        expires_delta = timedelta(minutes=1)
        
        token = jwt_handler.create_access_token(data, expires_delta)
        
        assert isinstance(token, str)
    
    def test_invalid_token(self, jwt_handler):
        """Test handling invalid token"""
        invalid_token = "invalid.token.here"
        
        with pytest.raises(Exception):
            jwt_handler.decode_token(invalid_token)


class TestPasswordHashing:
    """Test password hashing"""
    
    @pytest.fixture
    def password_handler(self):
        """Create password handler"""
        from auth.password import PasswordHandler
        return PasswordHandler()
    
    def test_hash_password(self, password_handler):
        """Test hashing password"""
        password = "SecurePassword123"
        
        hashed = password_handler.hash_password(password)
        
        assert isinstance(hashed, str)
        assert hashed != password
        assert len(hashed) > 0
    
    def test_verify_password(self, password_handler):
        """Test verifying password"""
        password = "SecurePassword123"
        hashed = password_handler.hash_password(password)
        
        is_valid = password_handler.verify_password(password, hashed)
        
        assert is_valid is True
    
    def test_verify_wrong_password(self, password_handler):
        """Test verifying wrong password"""
        password = "SecurePassword123"
        wrong_password = "WrongPassword456"
        hashed = password_handler.hash_password(password)
        
        is_valid = password_handler.verify_password(wrong_password, hashed)
        
        assert is_valid is False


class TestAuthMiddleware:
    """Test authentication middleware"""
    
    @pytest.fixture
    def auth_middleware(self):
        """Create auth middleware"""
        from auth.middleware import AuthMiddleware
        return AuthMiddleware()
    
    @pytest.mark.asyncio
    async def test_middleware_with_valid_token(self, auth_middleware):
        """Test middleware with valid token"""
        mock_request = MagicMock()
        mock_request.headers = {"Authorization": "Bearer valid_token"}
        
        with patch.object(auth_middleware, 'verify_token', return_value={"user_id": 1}):
            result = await auth_middleware.process_request(mock_request)
            
            assert result is not None
    
    @pytest.mark.asyncio
    async def test_middleware_without_token(self, auth_middleware):
        """Test middleware without token"""
        mock_request = MagicMock()
        mock_request.headers = {}
        
        with pytest.raises(Exception):
            await auth_middleware.process_request(mock_request)


class TestAuthPermissions:
    """Test authorization permissions"""
    
    @pytest.fixture
    def permission_checker(self):
        """Create permission checker"""
        from auth.permissions import PermissionChecker
        return PermissionChecker()
    
    def test_check_permission(self, permission_checker):
        """Test checking permission"""
        user = {"id": 1, "role": "admin"}
        
        has_permission = permission_checker.check(user, "delete_job")
        
        assert isinstance(has_permission, bool)
    
    def test_admin_has_all_permissions(self, permission_checker):
        """Test admin has all permissions"""
        admin_user = {"id": 1, "role": "admin"}
        
        has_permission = permission_checker.check(admin_user, "any_action")
        
        assert has_permission is True
    
    def test_regular_user_limited_permissions(self, permission_checker):
        """Test regular user has limited permissions"""
        regular_user = {"id": 2, "role": "user"}
        
        has_permission = permission_checker.check(regular_user, "delete_all_jobs")
        
        assert has_permission is False


class TestAuthRoles:
    """Test role-based access control"""
    
    @pytest.fixture
    def role_manager(self):
        """Create role manager"""
        from auth.roles import RoleManager
        return RoleManager()
    
    def test_assign_role(self, role_manager):
        """Test assigning role to user"""
        user_id = 1
        role = "admin"
        
        result = role_manager.assign_role(user_id, role)
        
        assert result is True or result is not None
    
    def test_get_user_roles(self, role_manager):
        """Test getting user roles"""
        user_id = 1
        
        roles = role_manager.get_user_roles(user_id)
        
        assert isinstance(roles, list)
    
    def test_has_role(self, role_manager):
        """Test checking if user has role"""
        user_id = 1
        role = "admin"
        
        has_role = role_manager.has_role(user_id, role)
        
        assert isinstance(has_role, bool)


class TestSessionManagement:
    """Test session management"""
    
    @pytest.fixture
    def session_manager(self):
        """Create session manager"""
        from auth.session import SessionManager
        return SessionManager()
    
    @pytest.mark.asyncio
    async def test_create_session(self, session_manager):
        """Test creating user session"""
        user_id = 1
        
        session_id = await session_manager.create_session(user_id)
        
        assert session_id is not None
        assert isinstance(session_id, str)
    
    @pytest.mark.asyncio
    async def test_get_session(self, session_manager):
        """Test getting session"""
        user_id = 1
        session_id = await session_manager.create_session(user_id)
        
        session = await session_manager.get_session(session_id)
        
        assert session is not None
    
    @pytest.mark.asyncio
    async def test_delete_session(self, session_manager):
        """Test deleting session"""
        user_id = 1
        session_id = await session_manager.create_session(user_id)
        
        result = await session_manager.delete_session(session_id)
        
        assert result is True or result is not None


class TestAuthValidation:
    """Test authentication validation"""
    
    def test_validate_email(self):
        """Test email validation"""
        from auth.validators import validate_email
        
        assert validate_email("test@example.com") is True
        assert validate_email("invalid-email") is False
    
    def test_validate_password_strength(self):
        """Test password strength validation"""
        from auth.validators import validate_password_strength
        
        assert validate_password_strength("SecurePass123!") is True
        assert validate_password_strength("weak") is False
    
    def test_validate_username(self):
        """Test username validation"""
        from auth.validators import validate_username
        
        assert validate_username("valid_user123") is True
        assert validate_username("a") is False  # Too short


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
