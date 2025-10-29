"""
Rate limiter for controlling scraping speed and avoiding detection.
Implements token bucket algorithm for smooth rate limiting.
"""
import asyncio
import time
from typing import Optional
from collections import deque
import structlog

logger = structlog.get_logger(__name__)


class RateLimiter:
    """
    Token bucket rate limiter for async operations.
    Allows burst requests up to bucket capacity while maintaining average rate.
    """
    
    def __init__(
        self,
        rate: float,
        capacity: Optional[int] = None,
        time_period: float = 1.0
    ):
        """
        Initialize rate limiter.
        
        Args:
            rate: Maximum number of operations per time_period
            capacity: Maximum burst size (defaults to rate)
            time_period: Time period in seconds (default: 1.0)
        """
        self.rate = rate
        self.capacity = capacity or int(rate)
        self.time_period = time_period
        
        self._tokens = float(self.capacity)
        self._last_update = time.monotonic()
        self._lock = asyncio.Lock()
        
        # Statistics
        self._total_requests = 0
        self._total_wait_time = 0.0
    
    async def acquire(self, tokens: int = 1):
        """
        Acquire tokens from the bucket.
        Waits if insufficient tokens available.
        
        Args:
            tokens: Number of tokens to acquire
        """
        async with self._lock:
            # Prevent infinite loop - max 3 wait cycles
            max_wait_cycles = 3
            wait_cycle = 0
            
            while wait_cycle < max_wait_cycles:
                now = time.monotonic()
                time_passed = now - self._last_update
                
                # Refill tokens based on time passed
                self._tokens = min(
                    self.capacity,
                    self._tokens + (time_passed * self.rate / self.time_period)
                )
                self._last_update = now
                
                # Check if we have enough tokens
                if self._tokens >= tokens:
                    self._tokens -= tokens
                    self._total_requests += 1
                    logger.debug(
                        "rate_limit_acquired",
                        tokens=tokens,
                        remaining=self._tokens
                    )
                    return
                
                # Calculate wait time
                tokens_needed = tokens - self._tokens
                wait_time = (tokens_needed * self.time_period) / self.rate
                
                # Cap maximum single wait to 5 seconds
                wait_time = min(wait_time, 5.0)
                
                logger.debug(
                    "rate_limit_waiting",
                    wait_time=wait_time,
                    tokens_needed=tokens_needed,
                    cycle=wait_cycle
                )
                
                self._total_wait_time += wait_time
                await asyncio.sleep(wait_time)
                wait_cycle += 1
            
            # If we still don't have tokens after max cycles, grant anyway
            logger.warning(
                "rate_limit_forced_grant",
                tokens=tokens,
                remaining=self._tokens,
                reason="max_wait_cycles_exceeded"
            )
            self._tokens = 0
            self._total_requests += 1
    
    async def __aenter__(self):
        """Context manager entry"""
        await self.acquire()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        pass
    
    def get_stats(self) -> dict:
        """Get rate limiter statistics"""
        return {
            'total_requests': self._total_requests,
            'total_wait_time': self._total_wait_time,
            'avg_wait_time': (
                self._total_wait_time / self._total_requests
                if self._total_requests > 0
                else 0
            ),
            'current_tokens': self._tokens,
            'capacity': self.capacity,
            'rate': self.rate
        }


class SlidingWindowRateLimiter:
    """
    Sliding window rate limiter.
    More accurate than token bucket for enforcing strict limits.
    """
    
    def __init__(self, max_requests: int, window_seconds: float):
        """
        Initialize sliding window rate limiter.
        
        Args:
            max_requests: Maximum requests allowed in window
            window_seconds: Time window in seconds
        """
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._requests: deque = deque()
        self._lock = asyncio.Lock()
    
    async def acquire(self):
        """Acquire permission to make a request"""
        async with self._lock:
            now = time.monotonic()
            
            # Remove old requests outside the window
            while self._requests and self._requests[0] < now - self.window_seconds:
                self._requests.popleft()
            
            # Check if we're at the limit
            if len(self._requests) >= self.max_requests:
                # Calculate wait time until oldest request expires
                oldest_request = self._requests[0]
                wait_time = (oldest_request + self.window_seconds) - now
                
                logger.debug(
                    "sliding_window_limit_reached",
                    current_requests=len(self._requests),
                    max_requests=self.max_requests,
                    wait_time=wait_time
                )
                
                await asyncio.sleep(wait_time)
                # Retry acquisition
                return await self.acquire()
            
            # Add current request
            self._requests.append(now)
            logger.debug(
                "sliding_window_acquired",
                current_requests=len(self._requests),
                max_requests=self.max_requests
            )
    
    async def __aenter__(self):
        """Context manager entry"""
        await self.acquire()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        pass


class AdaptiveRateLimiter:
    """
    Adaptive rate limiter that adjusts rate based on success/failure.
    Useful for avoiding rate limit errors from external services.
    """
    
    def __init__(
        self,
        initial_rate: float,
        min_rate: float = 1.0,
        max_rate: float = 100.0,
        increase_factor: float = 1.1,
        decrease_factor: float = 0.5
    ):
        """
        Initialize adaptive rate limiter.
        
        Args:
            initial_rate: Starting rate (requests per second)
            min_rate: Minimum allowed rate
            max_rate: Maximum allowed rate
            increase_factor: Factor to increase rate on success
            decrease_factor: Factor to decrease rate on failure
        """
        self.current_rate = initial_rate
        self.min_rate = min_rate
        self.max_rate = max_rate
        self.increase_factor = increase_factor
        self.decrease_factor = decrease_factor
        
        self._limiter = RateLimiter(self.current_rate)
        self._lock = asyncio.Lock()
        
        # Statistics
        self._success_count = 0
        self._failure_count = 0
    
    async def acquire(self):
        """Acquire permission to make a request"""
        await self._limiter.acquire()
    
    async def report_success(self):
        """Report successful request - may increase rate"""
        async with self._lock:
            self._success_count += 1
            
            # Increase rate gradually after consecutive successes
            if self._success_count % 10 == 0:
                old_rate = self.current_rate
                self.current_rate = min(
                    self.max_rate,
                    self.current_rate * self.increase_factor
                )
                
                if old_rate != self.current_rate:
                    self._limiter = RateLimiter(self.current_rate)
                    logger.info(
                        "rate_increased",
                        old_rate=old_rate,
                        new_rate=self.current_rate
                    )
    
    async def report_failure(self):
        """Report failed request (e.g., rate limit error) - decreases rate"""
        async with self._lock:
            self._failure_count += 1
            
            old_rate = self.current_rate
            self.current_rate = max(
                self.min_rate,
                self.current_rate * self.decrease_factor
            )
            
            self._limiter = RateLimiter(self.current_rate)
            
            logger.warning(
                "rate_decreased",
                old_rate=old_rate,
                new_rate=self.current_rate,
                reason="failure_reported"
            )
    
    def get_stats(self) -> dict:
        """Get rate limiter statistics"""
        return {
            'current_rate': self.current_rate,
            'success_count': self._success_count,
            'failure_count': self._failure_count,
            'success_rate': (
                self._success_count / (self._success_count + self._failure_count)
                if (self._success_count + self._failure_count) > 0
                else 0
            )
        }
