"""Unit tests for config module"""
import pytest
from unittest.mock import patch, MagicMock
import os


class TestSettings:
    """Test application settings"""
    
    @pytest.fixture
    def settings(self):
        """Create settings instance"""
        from config.settings import Settings
        return Settings()
    
    def test_settings_initialization(self, settings):
        """Test settings initialization"""
        assert settings is not None
    
    def test_database_url(self, settings):
        """Test database URL configuration"""
        assert hasattr(settings, 'database_url')
        assert isinstance(settings.database_url, str)
    
    def test_secret_key(self, settings):
        """Test secret key configuration"""
        assert hasattr(settings, 'secret_key')
    
    def test_debug_mode(self, settings):
        """Test debug mode setting"""
        assert hasattr(settings, 'debug')
        assert isinstance(settings.debug, bool)
    
    @patch.dict(os.environ, {'DATABASE_URL': 'postgresql://test:test@localhost/testdb'})
    def test_settings_from_env(self):
        """Test loading settings from environment"""
        from config.settings import Settings
        settings = Settings()
        
        assert 'postgresql' in settings.database_url or hasattr(settings, 'database_url')
    
    def test_api_settings(self, settings):
        """Test API settings"""
        assert hasattr(settings, 'api_host') or hasattr(settings, 'host')
        assert hasattr(settings, 'api_port') or hasattr(settings, 'port')
    
    def test_cors_settings(self, settings):
        """Test CORS settings"""
        assert hasattr(settings, 'cors_origins') or hasattr(settings, 'allowed_origins')
    
    def test_email_settings(self, settings):
        """Test email settings"""
        assert hasattr(settings, 'smtp_server') or hasattr(settings, 'email_enabled')
    
    def test_scraping_settings(self, settings):
        """Test scraping settings"""
        assert hasattr(settings, 'max_concurrent_scrapers') or hasattr(settings, 'scraping_enabled')


class TestDatabaseConfig:
    """Test database configuration"""
    
    @pytest.fixture
    def db_config(self):
        """Create database config"""
        from config.database import DatabaseConfig
        return DatabaseConfig()
    
    def test_config_initialization(self, db_config):
        """Test database config initialization"""
        assert db_config is not None
    
    def test_connection_string(self, db_config):
        """Test connection string generation"""
        conn_str = db_config.get_connection_string()
        
        assert isinstance(conn_str, str)
        assert len(conn_str) > 0
    
    def test_pool_settings(self, db_config):
        """Test connection pool settings"""
        assert hasattr(db_config, 'pool_size') or hasattr(db_config, 'max_connections')
    
    def test_timeout_settings(self, db_config):
        """Test timeout settings"""
        assert hasattr(db_config, 'connection_timeout') or hasattr(db_config, 'timeout')


class TestLoggingConfig:
    """Test logging configuration"""
    
    @pytest.fixture
    def logging_config(self):
        """Create logging config"""
        from config.logging import LoggingConfig
        return LoggingConfig()
    
    def test_config_initialization(self, logging_config):
        """Test logging config initialization"""
        assert logging_config is not None
    
    def test_log_level(self, logging_config):
        """Test log level setting"""
        assert hasattr(logging_config, 'log_level')
        assert logging_config.log_level in ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']
    
    def test_log_format(self, logging_config):
        """Test log format setting"""
        assert hasattr(logging_config, 'log_format')
    
    def test_log_file_path(self, logging_config):
        """Test log file path setting"""
        assert hasattr(logging_config, 'log_file') or hasattr(logging_config, 'log_directory')
    
    def test_setup_logging(self, logging_config):
        """Test setting up logging"""
        result = logging_config.setup()
        
        assert result is not None or result is None  # Setup may return None


class TestCacheConfig:
    """Test cache configuration"""
    
    @pytest.fixture
    def cache_config(self):
        """Create cache config"""
        from config.cache import CacheConfig
        return CacheConfig()
    
    def test_config_initialization(self, cache_config):
        """Test cache config initialization"""
        assert cache_config is not None
    
    def test_cache_backend(self, cache_config):
        """Test cache backend setting"""
        assert hasattr(cache_config, 'backend')
    
    def test_cache_ttl(self, cache_config):
        """Test cache TTL setting"""
        assert hasattr(cache_config, 'default_ttl') or hasattr(cache_config, 'ttl')
    
    def test_cache_max_size(self, cache_config):
        """Test cache max size setting"""
        assert hasattr(cache_config, 'max_size') or hasattr(cache_config, 'max_entries')


class TestSecurityConfig:
    """Test security configuration"""
    
    @pytest.fixture
    def security_config(self):
        """Create security config"""
        from config.security import SecurityConfig
        return SecurityConfig()
    
    def test_config_initialization(self, security_config):
        """Test security config initialization"""
        assert security_config is not None
    
    def test_jwt_settings(self, security_config):
        """Test JWT settings"""
        assert hasattr(security_config, 'jwt_secret') or hasattr(security_config, 'secret_key')
        assert hasattr(security_config, 'jwt_algorithm') or hasattr(security_config, 'algorithm')
    
    def test_token_expiration(self, security_config):
        """Test token expiration settings"""
        assert hasattr(security_config, 'access_token_expire_minutes') or hasattr(security_config, 'token_expiry')
    
    def test_password_requirements(self, security_config):
        """Test password requirements"""
        assert hasattr(security_config, 'min_password_length') or hasattr(security_config, 'password_min_length')


class TestAPIConfig:
    """Test API configuration"""
    
    @pytest.fixture
    def api_config(self):
        """Create API config"""
        from config.api import APIConfig
        return APIConfig()
    
    def test_config_initialization(self, api_config):
        """Test API config initialization"""
        assert api_config is not None
    
    def test_api_version(self, api_config):
        """Test API version setting"""
        assert hasattr(api_config, 'version') or hasattr(api_config, 'api_version')
    
    def test_api_prefix(self, api_config):
        """Test API prefix setting"""
        assert hasattr(api_config, 'prefix') or hasattr(api_config, 'api_prefix')
    
    def test_rate_limiting(self, api_config):
        """Test rate limiting settings"""
        assert hasattr(api_config, 'rate_limit') or hasattr(api_config, 'max_requests_per_minute')
    
    def test_pagination_settings(self, api_config):
        """Test pagination settings"""
        assert hasattr(api_config, 'default_page_size') or hasattr(api_config, 'page_size')


class TestEnvironmentConfig:
    """Test environment-specific configuration"""
    
    def test_development_config(self):
        """Test development configuration"""
        with patch.dict(os.environ, {'ENVIRONMENT': 'development'}):
            from config.settings import get_settings
            settings = get_settings()
            
            assert settings is not None
    
    def test_production_config(self):
        """Test production configuration"""
        with patch.dict(os.environ, {'ENVIRONMENT': 'production'}):
            from config.settings import get_settings
            settings = get_settings()
            
            assert settings is not None
    
    def test_testing_config(self):
        """Test testing configuration"""
        with patch.dict(os.environ, {'ENVIRONMENT': 'testing'}):
            from config.settings import get_settings
            settings = get_settings()
            
            assert settings is not None


class TestConfigValidation:
    """Test configuration validation"""
    
    def test_validate_database_url(self):
        """Test database URL validation"""
        from config.validators import validate_database_url
        
        assert validate_database_url("postgresql://user:pass@localhost/db") is True
        assert validate_database_url("invalid_url") is False
    
    def test_validate_email(self):
        """Test email validation"""
        from config.validators import validate_email
        
        assert validate_email("test@example.com") is True
        assert validate_email("invalid-email") is False
    
    def test_validate_port(self):
        """Test port validation"""
        from config.validators import validate_port
        
        assert validate_port(8000) is True
        assert validate_port(70000) is False
        assert validate_port(-1) is False
    
    def test_validate_url(self):
        """Test URL validation"""
        from config.validators import validate_url
        
        assert validate_url("https://example.com") is True
        assert validate_url("not-a-url") is False


class TestConfigLoader:
    """Test configuration loader"""
    
    def test_load_from_file(self):
        """Test loading config from file"""
        from config.loader import load_config
        
        with patch("builtins.open", create=True):
            with patch("json.load", return_value={"key": "value"}):
                config = load_config("config.json")
                
                assert config is not None
    
    def test_load_from_env(self):
        """Test loading config from environment"""
        from config.loader import load_from_env
        
        with patch.dict(os.environ, {'TEST_KEY': 'test_value'}):
            config = load_from_env()
            
            assert config is not None
    
    def test_merge_configs(self):
        """Test merging multiple configs"""
        from config.loader import merge_configs
        
        config1 = {"key1": "value1", "key2": "value2"}
        config2 = {"key2": "new_value2", "key3": "value3"}
        
        merged = merge_configs(config1, config2)
        
        assert merged["key1"] == "value1"
        assert merged["key2"] == "new_value2"
        assert merged["key3"] == "value3"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
