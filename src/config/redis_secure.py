"""Secure Redis configuration with TLS and authentication"""
import redis
from redis.connection import SSLConnection
import ssl
import logging
from typing import Optional
import os

logger = logging.getLogger(__name__)


class SecureRedisClient:
    """Secure Redis client with TLS and authentication"""
    
    def __init__(
        self,
        host: str = "localhost",
        port: int = 6379,
        db: int = 0,
        password: Optional[str] = None,
        use_tls: bool = False,
        ssl_cert_reqs: str = "required",
        ssl_ca_certs: Optional[str] = None,
        ssl_certfile: Optional[str] = None,
        ssl_keyfile: Optional[str] = None,
        socket_timeout: int = 5,
        socket_connect_timeout: int = 5,
        max_connections: int = 20,
        decode_responses: bool = True
    ):
        """
        Initialize secure Redis client
        
        Args:
            host: Redis server host
            port: Redis server port
            db: Redis database number
            password: Redis password (AUTH)
            use_tls: Enable TLS/SSL encryption
            ssl_cert_reqs: SSL certificate requirements ('none', 'optional', 'required')
            ssl_ca_certs: Path to CA certificates file
            ssl_certfile: Path to client certificate file
            ssl_keyfile: Path to client private key file
            socket_timeout: Socket timeout in seconds
            socket_connect_timeout: Socket connection timeout in seconds
            max_connections: Maximum number of connections in pool
            decode_responses: Decode responses to strings
        """
        self.host = host
        self.port = port
        self.db = db
        self.password = password
        self.use_tls = use_tls
        
        # Connection pool configuration
        pool_kwargs = {
            'host': host,
            'port': port,
            'db': db,
            'password': password,
            'socket_timeout': socket_timeout,
            'socket_connect_timeout': socket_connect_timeout,
            'max_connections': max_connections,
            'decode_responses': decode_responses
        }
        
        # Add TLS configuration if enabled
        if use_tls:
            pool_kwargs['connection_class'] = SSLConnection
            
            # SSL certificate requirements
            ssl_cert_reqs_map = {
                'none': ssl.CERT_NONE,
                'optional': ssl.CERT_OPTIONAL,
                'required': ssl.CERT_REQUIRED
            }
            pool_kwargs['ssl_cert_reqs'] = ssl_cert_reqs_map.get(ssl_cert_reqs, ssl.CERT_REQUIRED)
            
            # SSL certificates
            if ssl_ca_certs:
                pool_kwargs['ssl_ca_certs'] = ssl_ca_certs
            if ssl_certfile:
                pool_kwargs['ssl_certfile'] = ssl_certfile
            if ssl_keyfile:
                pool_kwargs['ssl_keyfile'] = ssl_keyfile
        
        # Create connection pool
        self.connection_pool = redis.ConnectionPool(**pool_kwargs)
        
        # Create Redis client
        self.client = redis.Redis(connection_pool=self.connection_pool)
        
        logger.info(
            f"Redis client initialized: host={host}, port={port}, db={db}, "
            f"tls={use_tls}, auth={'enabled' if password else 'disabled'}"
        )
    
    def ping(self) -> bool:
        """
        Test Redis connection
        
        Returns:
            True if connection is successful
        """
        try:
            return self.client.ping()
        except Exception as e:
            logger.error(f"Redis ping failed: {e}")
            return False
    
    def get_client(self) -> redis.Redis:
        """
        Get Redis client instance
        
        Returns:
            Redis client
        """
        return self.client
    
    def close(self) -> None:
        """Close Redis connection pool"""
        try:
            self.connection_pool.disconnect()
            logger.info("Redis connection pool closed")
        except Exception as e:
            logger.error(f"Error closing Redis connection pool: {e}")


def create_secure_redis_client(
    host: Optional[str] = None,
    port: Optional[int] = None,
    db: Optional[int] = None,
    password: Optional[str] = None,
    use_tls: Optional[bool] = None
) -> SecureRedisClient:
    """
    Create secure Redis client from environment variables
    
    Args:
        host: Redis host (defaults to REDIS_HOST env var)
        port: Redis port (defaults to REDIS_PORT env var)
        db: Redis database (defaults to REDIS_DB env var)
        password: Redis password (defaults to REDIS_PASSWORD env var)
        use_tls: Use TLS (defaults to REDIS_USE_TLS env var)
        
    Returns:
        Secure Redis client
    """
    # Get configuration from environment
    host = host or os.getenv('REDIS_HOST', 'localhost')
    port = port or int(os.getenv('REDIS_PORT', '6379'))
    db = db or int(os.getenv('REDIS_DB', '0'))
    password = password or os.getenv('REDIS_PASSWORD')
    use_tls = use_tls if use_tls is not None else os.getenv('REDIS_USE_TLS', 'false').lower() == 'true'
    
    # SSL configuration
    ssl_ca_certs = os.getenv('REDIS_SSL_CA_CERTS')
    ssl_certfile = os.getenv('REDIS_SSL_CERTFILE')
    ssl_keyfile = os.getenv('REDIS_SSL_KEYFILE')
    ssl_cert_reqs = os.getenv('REDIS_SSL_CERT_REQS', 'required')
    
    # Connection timeouts
    socket_timeout = int(os.getenv('REDIS_SOCKET_TIMEOUT', '5'))
    socket_connect_timeout = int(os.getenv('REDIS_SOCKET_CONNECT_TIMEOUT', '5'))
    max_connections = int(os.getenv('REDIS_MAX_CONNECTIONS', '20'))
    
    return SecureRedisClient(
        host=host,
        port=port,
        db=db,
        password=password,
        use_tls=use_tls,
        ssl_cert_reqs=ssl_cert_reqs,
        ssl_ca_certs=ssl_ca_certs,
        ssl_certfile=ssl_certfile,
        ssl_keyfile=ssl_keyfile,
        socket_timeout=socket_timeout,
        socket_connect_timeout=socket_connect_timeout,
        max_connections=max_connections
    )


# Global secure Redis client instance
_secure_redis_client: Optional[SecureRedisClient] = None


def get_secure_redis_client() -> SecureRedisClient:
    """
    Get global secure Redis client instance
    
    Returns:
        Secure Redis client
    """
    global _secure_redis_client
    
    if _secure_redis_client is None:
        _secure_redis_client = create_secure_redis_client()
    
    return _secure_redis_client


def get_redis_client() -> redis.Redis:
    """
    Get Redis client instance
    
    Returns:
        Redis client
    """
    return get_secure_redis_client().get_client()
