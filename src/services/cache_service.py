"""
Redis Cache Service for God Lion Seeker Optimizer

This service provides caching functionality for:
- Job listings to avoid duplicate scraping
- Search results for faster retrieval
- Rate limiting data
- Session management
- API responses
"""

import json
import pickle
from typing import Any, Optional, List, Dict, Union
from datetime import timedelta
import structlog
from redis.asyncio import Redis, ConnectionPool
from redis.exceptions import RedisError

from src.config.settings import settings

logger = structlog.get_logger(__name__)


class CacheService:
    """Redis-based caching service with async support"""
    
    def __init__(
        self,
        host: str = None,
        port: int = None,
        db: int = None,
        password: Optional[str] = None,
        **kwargs
    ):
        """
        Initialize Redis cache service
        
        Args:
            host: Redis host (default from settings)
            port: Redis port (default from settings)
            db: Redis database number (default from settings)
            password: Redis password if required
            **kwargs: Additional Redis connection parameters
        """
        self.host = host or getattr(settings, 'redis_host', 'localhost')
        self.port = port or getattr(settings, 'redis_port', 6379)
        self.db = db or getattr(settings, 'redis_db', 0)
        self.password = password
        
        # Create connection pool
        self.pool = ConnectionPool(
            host=self.host,
            port=self.port,
            db=self.db,
            password=self.password,
            decode_responses=False,  # We'll handle encoding/decoding
            max_connections=20,
            socket_connect_timeout=5,
            socket_timeout=5,
            **kwargs
        )
        
        self._redis: Optional[Redis] = None
        self._is_connected = False
        
        # Cache key prefixes for organization
        self.KEY_PREFIX_JOB = "job:"
        self.KEY_PREFIX_SEARCH = "search:"
        self.KEY_PREFIX_COMPANY = "company:"
        self.KEY_PREFIX_SESSION = "session:"
        self.KEY_PREFIX_RATE_LIMIT = "ratelimit:"
        self.KEY_PREFIX_API = "api:"
        
        logger.info(
            "cache_service_initialized",
            host=self.host,
            port=self.port,
            db=self.db
        )
    
    async def connect(self) -> bool:
        """
        Establish connection to Redis
        
        Returns:
            bool: True if connection successful, False otherwise
        """
        try:
            self._redis = Redis(connection_pool=self.pool)
            await self._redis.ping()
            self._is_connected = True
            logger.info("redis_connected", host=self.host, port=self.port)
            return True
        except RedisError as e:
            logger.error("redis_connection_failed", error=str(e))
            self._is_connected = False
            return False
    
    async def disconnect(self):
        """Close Redis connection"""
        if self._redis:
            await self._redis.aclose()
            await self.pool.disconnect()
            self._is_connected = False
            logger.info("redis_disconnected")
    
    async def is_connected(self) -> bool:
        """Check if Redis is connected and responsive"""
        try:
            if self._redis:
                await self._redis.ping()
                return True
        except RedisError:
            pass
        return False
    
    async def _ensure_connection(self):
        """Ensure Redis connection is established"""
        if not self._is_connected or not await self.is_connected():
            await self.connect()
    
    # ==================== Basic Operations ====================
    
    async def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[Union[int, timedelta]] = None,
        serialize: bool = True
    ) -> bool:
        """
        Set a value in cache
        
        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds or timedelta
            serialize: Whether to serialize the value (pickle for complex objects)
        
        Returns:
            bool: True if successful
        """
        await self._ensure_connection()
        
        try:
            # Serialize value if needed
            if serialize:
                if isinstance(value, (dict, list, tuple)):
                    cached_value = json.dumps(value).encode('utf-8')
                else:
                    cached_value = pickle.dumps(value)
            else:
                cached_value = str(value).encode('utf-8')
            
            # Convert timedelta to seconds
            if isinstance(ttl, timedelta):
                ttl = int(ttl.total_seconds())
            
            # Set value with optional TTL
            if ttl:
                await self._redis.setex(key, ttl, cached_value)
            else:
                await self._redis.set(key, cached_value)
            
            logger.debug("cache_set", key=key, ttl=ttl)
            return True
            
        except RedisError as e:
            logger.error("cache_set_failed", key=key, error=str(e))
            return False
    
    async def get(
        self,
        key: str,
        deserialize: bool = True,
        default: Any = None
    ) -> Any:
        """
        Get a value from cache
        
        Args:
            key: Cache key
            deserialize: Whether to deserialize the value
            default: Default value if key not found
        
        Returns:
            Cached value or default
        """
        await self._ensure_connection()
        
        try:
            value = await self._redis.get(key)
            
            if value is None:
                return default
            
            # Deserialize if needed
            if deserialize:
                try:
                    # Try JSON first (for dict/list)
                    return json.loads(value.decode('utf-8'))
                except (json.JSONDecodeError, UnicodeDecodeError):
                    # Fall back to pickle
                    return pickle.loads(value)
            else:
                return value.decode('utf-8')
                
        except RedisError as e:
            logger.error("cache_get_failed", key=key, error=str(e))
            return default
    
    async def delete(self, key: str) -> bool:
        """
        Delete a key from cache
        
        Args:
            key: Cache key to delete
        
        Returns:
            bool: True if key was deleted
        """
        await self._ensure_connection()
        
        try:
            result = await self._redis.delete(key)
            logger.debug("cache_delete", key=key, deleted=bool(result))
            return bool(result)
        except RedisError as e:
            logger.error("cache_delete_failed", key=key, error=str(e))
            return False
    
    async def exists(self, key: str) -> bool:
        """
        Check if a key exists in cache
        
        Args:
            key: Cache key to check
        
        Returns:
            bool: True if key exists
        """
        await self._ensure_connection()
        
        try:
            return bool(await self._redis.exists(key))
        except RedisError as e:
            logger.error("cache_exists_failed", key=key, error=str(e))
            return False
    
    async def expire(self, key: str, ttl: Union[int, timedelta]) -> bool:
        """
        Set expiration time for a key
        
        Args:
            key: Cache key
            ttl: Time to live in seconds or timedelta
        
        Returns:
            bool: True if successful
        """
        await self._ensure_connection()
        
        try:
            if isinstance(ttl, timedelta):
                ttl = int(ttl.total_seconds())
            
            result = await self._redis.expire(key, ttl)
            return bool(result)
        except RedisError as e:
            logger.error("cache_expire_failed", key=key, error=str(e))
            return False
    
    # ==================== Job Caching ====================
    
    async def cache_job(
        self,
        job_id: str,
        job_data: Dict[str, Any],
        ttl: int = 86400  # 24 hours default
    ) -> bool:
        """
        Cache a job listing
        
        Args:
            job_id: Unique job identifier
            job_data: Job data dictionary
            ttl: Time to live in seconds (default 24 hours)
        
        Returns:
            bool: True if cached successfully
        """
        key = f"{self.KEY_PREFIX_JOB}{job_id}"
        return await self.set(key, job_data, ttl=ttl)
    
    async def get_cached_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve a cached job listing
        
        Args:
            job_id: Unique job identifier
        
        Returns:
            Job data dictionary or None
        """
        key = f"{self.KEY_PREFIX_JOB}{job_id}"
        return await self.get(key)
    
    async def is_job_cached(self, job_id: str) -> bool:
        """
        Check if a job is already cached
        
        Args:
            job_id: Unique job identifier
        
        Returns:
            bool: True if job is cached
        """
        key = f"{self.KEY_PREFIX_JOB}{job_id}"
        return await self.exists(key)
    
    # ==================== Search Results Caching ====================
    
    async def cache_search_results(
        self,
        search_query: str,
        location: str,
        results: List[Dict[str, Any]],
        ttl: int = 3600  # 1 hour default
    ) -> bool:
        """
        Cache search results
        
        Args:
            search_query: Search query string
            location: Location string
            results: List of job dictionaries
            ttl: Time to live in seconds (default 1 hour)
        
        Returns:
            bool: True if cached successfully
        """
        key = f"{self.KEY_PREFIX_SEARCH}{search_query}:{location}"
        return await self.set(key, results, ttl=ttl)
    
    async def get_cached_search_results(
        self,
        search_query: str,
        location: str
    ) -> Optional[List[Dict[str, Any]]]:
        """
        Retrieve cached search results
        
        Args:
            search_query: Search query string
            location: Location string
        
        Returns:
            List of job dictionaries or None
        """
        key = f"{self.KEY_PREFIX_SEARCH}{search_query}:{location}"
        return await self.get(key)
    
    # ==================== Company Caching ====================
    
    async def cache_company(
        self,
        company_id: str,
        company_data: Dict[str, Any],
        ttl: int = 604800  # 7 days default
    ) -> bool:
        """
        Cache company information
        
        Args:
            company_id: Unique company identifier
            company_data: Company data dictionary
            ttl: Time to live in seconds (default 7 days)
        
        Returns:
            bool: True if cached successfully
        """
        key = f"{self.KEY_PREFIX_COMPANY}{company_id}"
        return await self.set(key, company_data, ttl=ttl)
    
    async def get_cached_company(self, company_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve cached company information
        
        Args:
            company_id: Unique company identifier
        
        Returns:
            Company data dictionary or None
        """
        key = f"{self.KEY_PREFIX_COMPANY}{company_id}"
        return await self.get(key)
    
    # ==================== Rate Limiting ====================
    
    async def increment_rate_limit(
        self,
        identifier: str,
        window: int = 60,
        max_requests: int = 10
    ) -> tuple[int, bool]:
        """
        Increment rate limit counter
        
        Args:
            identifier: Unique identifier (IP, user, etc.)
            window: Time window in seconds
            max_requests: Maximum requests allowed in window
        
        Returns:
            Tuple of (current_count, is_allowed)
        """
        await self._ensure_connection()
        
        key = f"{self.KEY_PREFIX_RATE_LIMIT}{identifier}"
        
        try:
            # Increment counter
            count = await self._redis.incr(key)
            
            # Set expiration on first request
            if count == 1:
                await self._redis.expire(key, window)
            
            is_allowed = count <= max_requests
            
            logger.debug(
                "rate_limit_check",
                identifier=identifier,
                count=count,
                max_requests=max_requests,
                is_allowed=is_allowed
            )
            
            return count, is_allowed
            
        except RedisError as e:
            logger.error("rate_limit_failed", identifier=identifier, error=str(e))
            # On error, allow the request
            return 0, True
    
    async def get_rate_limit_remaining(
        self,
        identifier: str,
        max_requests: int = 10
    ) -> int:
        """
        Get remaining requests in rate limit window
        
        Args:
            identifier: Unique identifier
            max_requests: Maximum requests allowed
        
        Returns:
            Number of remaining requests
        """
        key = f"{self.KEY_PREFIX_RATE_LIMIT}{identifier}"
        count = await self.get(key, deserialize=False, default="0")
        current = int(count)
        return max(0, max_requests - current)
    
    # ==================== Session Management ====================
    
    async def store_session(
        self,
        session_id: str,
        session_data: Dict[str, Any],
        ttl: int = 3600  # 1 hour default
    ) -> bool:
        """
        Store session data
        
        Args:
            session_id: Unique session identifier
            session_data: Session data dictionary
            ttl: Time to live in seconds
        
        Returns:
            bool: True if stored successfully
        """
        key = f"{self.KEY_PREFIX_SESSION}{session_id}"
        return await self.set(key, session_data, ttl=ttl)
    
    async def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve session data
        
        Args:
            session_id: Unique session identifier
        
        Returns:
            Session data dictionary or None
        """
        key = f"{self.KEY_PREFIX_SESSION}{session_id}"
        return await self.get(key)
    
    async def delete_session(self, session_id: str) -> bool:
        """
        Delete session data
        
        Args:
            session_id: Unique session identifier
        
        Returns:
            bool: True if deleted
        """
        key = f"{self.KEY_PREFIX_SESSION}{session_id}"
        return await self.delete(key)
    
    # ==================== Pattern Operations ====================
    
    async def get_keys(self, pattern: str) -> List[str]:
        """
        Get all keys matching a pattern
        
        Args:
            pattern: Key pattern (e.g., "job:*")
        
        Returns:
            List of matching keys
        """
        await self._ensure_connection()
        
        try:
            keys = await self._redis.keys(pattern)
            return [key.decode('utf-8') for key in keys]
        except RedisError as e:
            logger.error("cache_keys_failed", pattern=pattern, error=str(e))
            return []
    
    async def delete_pattern(self, pattern: str) -> int:
        """
        Delete all keys matching a pattern
        
        Args:
            pattern: Key pattern (e.g., "job:*")
        
        Returns:
            Number of keys deleted
        """
        await self._ensure_connection()
        
        try:
            keys = await self._redis.keys(pattern)
            if keys:
                deleted = await self._redis.delete(*keys)
                logger.info("cache_pattern_deleted", pattern=pattern, count=deleted)
                return deleted
            return 0
        except RedisError as e:
            logger.error("cache_delete_pattern_failed", pattern=pattern, error=str(e))
            return 0
    
    # ==================== Cache Statistics ====================
    
    async def get_stats(self) -> Dict[str, Any]:
        """
        Get cache statistics
        
        Returns:
            Dictionary with cache statistics
        """
        await self._ensure_connection()
        
        try:
            info = await self._redis.info()
            
            stats = {
                "connected": True,
                "used_memory": info.get("used_memory_human", "N/A"),
                "total_keys": await self._redis.dbsize(),
                "connected_clients": info.get("connected_clients", 0),
                "uptime_days": info.get("uptime_in_days", 0),
                "hit_rate": self._calculate_hit_rate(info)
            }
            
            return stats
            
        except RedisError as e:
            logger.error("cache_stats_failed", error=str(e))
            return {"connected": False, "error": str(e)}
    
    def _calculate_hit_rate(self, info: Dict) -> float:
        """Calculate cache hit rate from Redis INFO"""
        hits = info.get("keyspace_hits", 0)
        misses = info.get("keyspace_misses", 0)
        total = hits + misses
        
        if total == 0:
            return 0.0
        
        return round((hits / total) * 100, 2)
    
    async def clear_all(self) -> bool:
        """
        Clear all cache data (use with caution!)
        
        Returns:
            bool: True if successful
        """
        await self._ensure_connection()
        
        try:
            await self._redis.flushdb()
            logger.warning("cache_cleared_all")
            return True
        except RedisError as e:
            logger.error("cache_clear_all_failed", error=str(e))
            return False


# Global cache service instance
cache_service: Optional[CacheService] = None


async def get_cache_service() -> CacheService:
    """
    Get or create global cache service instance
    
    Returns:
        CacheService instance
    """
    global cache_service
    
    if cache_service is None:
        cache_service = CacheService()
        await cache_service.connect()
    
    return cache_service


async def close_cache_service():
    """Close global cache service"""
    global cache_service
    
    if cache_service:
        await cache_service.disconnect()
        cache_service = None
