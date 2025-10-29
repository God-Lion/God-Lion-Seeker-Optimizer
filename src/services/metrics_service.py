"""
Prometheus Metrics Service for monitoring job scraping operations.

This service provides comprehensive metrics for:
- Job scraping operations (success/failure rates)
- Database operations (queries, connections)
- Performance metrics (latency, throughput)
- System health (cache hits, errors)
"""
import time
from typing import Optional, Callable, Any
from functools import wraps
from contextlib import asynccontextmanager
import structlog

from prometheus_client import (
    Counter,
    Histogram,
    Gauge,
    Summary,
    Info,
    CollectorRegistry,
    generate_latest,
    CONTENT_TYPE_LATEST,
)

logger = structlog.get_logger(__name__)


class MetricsService:
    """
    Centralized metrics service using Prometheus client.
    
    Provides metrics for monitoring application health, performance,
    and business logic across all services.
    """
    
    def __init__(self, registry: Optional[CollectorRegistry] = None):
        """
        Initialize metrics service with Prometheus collectors.
        
        Args:
            registry: Optional custom registry (useful for testing)
        """
        self.registry = registry or CollectorRegistry()
        
        # ============================================================
        # SCRAPING METRICS
        # ============================================================
        
        self.jobs_scraped_total = Counter(
            'jobs_scraped_total',
            'Total number of jobs scraped',
            ['status', 'query_type'],
            registry=self.registry
        )
        
        self.scraping_sessions_total = Counter(
            'scraping_sessions_total',
            'Total number of scraping sessions',
            ['status'],
            registry=self.registry
        )
        
        self.scraping_duration_seconds = Histogram(
            'scraping_duration_seconds',
            'Time spent scraping jobs',
            ['query_type'],
            buckets=(1, 5, 10, 30, 60, 120, 300, 600, 1800),
            registry=self.registry
        )
        
        self.jobs_per_scraping_session = Histogram(
            'jobs_per_scraping_session',
            'Number of jobs scraped per session',
            buckets=(0, 10, 25, 50, 100, 250, 500, 1000),
            registry=self.registry
        )
        
        self.scraping_errors_total = Counter(
            'scraping_errors_total',
            'Total scraping errors',
            ['error_type', 'query_type'],
            registry=self.registry
        )
        
        self.active_scraping_sessions = Gauge(
            'active_scraping_sessions',
            'Number of currently active scraping sessions',
            registry=self.registry
        )
        
        # ============================================================
        # DATABASE METRICS
        # ============================================================
        
        self.db_queries_total = Counter(
            'db_queries_total',
            'Total database queries',
            ['operation', 'table', 'status'],
            registry=self.registry
        )
        
        self.db_query_duration_seconds = Histogram(
            'db_query_duration_seconds',
            'Database query execution time',
            ['operation', 'table'],
            buckets=(0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0),
            registry=self.registry
        )
        
        self.db_connections_active = Gauge(
            'db_connections_active',
            'Number of active database connections',
            registry=self.registry
        )
        
        self.db_connection_pool_size = Gauge(
            'db_connection_pool_size',
            'Size of database connection pool',
            registry=self.registry
        )
        
        self.db_transaction_duration_seconds = Histogram(
            'db_transaction_duration_seconds',
            'Database transaction duration',
            ['status'],
            buckets=(0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0),
            registry=self.registry
        )
        
        # ============================================================
        # JOB PROCESSING METRICS
        # ============================================================
        
        self.jobs_stored_total = Counter(
            'jobs_stored_total',
            'Total jobs stored in database',
            ['type'],  # new, updated, duplicate
            registry=self.registry
        )
        
        self.job_matching_duration_seconds = Histogram(
            'job_matching_duration_seconds',
            'Time spent matching jobs',
            buckets=(0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0),
            registry=self.registry
        )
        
        self.job_matches_total = Counter(
            'job_matches_total',
            'Total job matches',
            ['match_quality'],  # excellent, good, fair, poor
            registry=self.registry
        )
        
        self.resume_generations_total = Counter(
            'resume_generations_total',
            'Total resume generations',
            ['status', 'format'],
            registry=self.registry
        )
        
        self.resume_generation_duration_seconds = Histogram(
            'resume_generation_duration_seconds',
            'Time spent generating resumes',
            ['format'],
            buckets=(0.5, 1.0, 2.5, 5.0, 10.0, 20.0, 30.0),
            registry=self.registry
        )
        
        # ============================================================
        # CACHE METRICS
        # ============================================================
        
        self.cache_hits_total = Counter(
            'cache_hits_total',
            'Total cache hits',
            ['cache_type'],
            registry=self.registry
        )
        
        self.cache_misses_total = Counter(
            'cache_misses_total',
            'Total cache misses',
            ['cache_type'],
            registry=self.registry
        )
        
        self.cache_size_bytes = Gauge(
            'cache_size_bytes',
            'Current cache size in bytes',
            ['cache_type'],
            registry=self.registry
        )
        
        self.cache_evictions_total = Counter(
            'cache_evictions_total',
            'Total cache evictions',
            ['cache_type', 'reason'],
            registry=self.registry
        )
        
        # ============================================================
        # RATE LIMITING METRICS
        # ============================================================
        
        self.rate_limit_hits_total = Counter(
            'rate_limit_hits_total',
            'Total rate limit hits',
            ['limiter_type'],
            registry=self.registry
        )
        
        self.rate_limit_wait_seconds = Histogram(
            'rate_limit_wait_seconds',
            'Time spent waiting for rate limits',
            ['limiter_type'],
            buckets=(0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0),
            registry=self.registry
        )
        
        # ============================================================
        # SYSTEM METRICS
        # ============================================================
        
        self.application_info = Info(
            'application',
            'Application information',
            registry=self.registry
        )
        
        self.http_requests_total = Counter(
            'http_requests_total',
            'Total HTTP requests',
            ['method', 'endpoint', 'status'],
            registry=self.registry
        )
        
        self.http_request_duration_seconds = Histogram(
            'http_request_duration_seconds',
            'HTTP request duration',
            ['method', 'endpoint'],
            buckets=(0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0),
            registry=self.registry
        )
        
        self.browser_sessions_active = Gauge(
            'browser_sessions_active',
            'Number of active browser sessions',
            registry=self.registry
        )
        
        self.memory_usage_bytes = Gauge(
            'memory_usage_bytes',
            'Current memory usage in bytes',
            ['type'],  # rss, vms, shared
            registry=self.registry
        )
        
        logger.info("metrics_service_initialized")
    
    # ============================================================
    # DECORATOR HELPERS
    # ============================================================
    
    def track_scraping_operation(self, query_type: str = "general"):
        """
        Decorator to track scraping operations.
        
        Usage:
            @metrics_service.track_scraping_operation("python_jobs")
            async def scrape_jobs(...):
                ...
        """
        def decorator(func: Callable) -> Callable:
            @wraps(func)
            async def wrapper(*args, **kwargs):
                start_time = time.time()
                self.active_scraping_sessions.inc()
                
                try:
                    result = await func(*args, **kwargs)
                    
                    # Track success
                    duration = time.time() - start_time
                    self.scraping_duration_seconds.labels(
                        query_type=query_type
                    ).observe(duration)
                    
                    self.scraping_sessions_total.labels(
                        status="success"
                    ).inc()
                    
                    # Track job counts if available
                    if isinstance(result, dict):
                        job_count = result.get('jobs_scraped', 0)
                        self.jobs_scraped_total.labels(
                            status="success",
                            query_type=query_type
                        ).inc(job_count)
                        
                        self.jobs_per_scraping_session.observe(job_count)
                        
                        # Track job storage
                        new_jobs = result.get('new_jobs', 0)
                        updated_jobs = result.get('updated_jobs', 0)
                        errors = result.get('errors', 0)
                        
                        if new_jobs:
                            self.jobs_stored_total.labels(type="new").inc(new_jobs)
                        if updated_jobs:
                            self.jobs_stored_total.labels(type="updated").inc(updated_jobs)
                        if errors:
                            self.scraping_errors_total.labels(
                                error_type="storage_error",
                                query_type=query_type
                            ).inc(errors)
                    
                    return result
                    
                except Exception as e:
                    # Track failure
                    duration = time.time() - start_time
                    self.scraping_duration_seconds.labels(
                        query_type=query_type
                    ).observe(duration)
                    
                    self.scraping_sessions_total.labels(
                        status="failed"
                    ).inc()
                    
                    self.scraping_errors_total.labels(
                        error_type=type(e).__name__,
                        query_type=query_type
                    ).inc()
                    
                    logger.error(
                        "scraping_operation_failed",
                        query_type=query_type,
                        error=str(e),
                        duration=duration
                    )
                    raise
                    
                finally:
                    self.active_scraping_sessions.dec()
            
            return wrapper
        return decorator
    
    def track_db_query(self, operation: str, table: str):
        """
        Decorator to track database queries.
        
        Usage:
            @metrics_service.track_db_query("select", "jobs")
            async def get_jobs(...):
                ...
        """
        def decorator(func: Callable) -> Callable:
            @wraps(func)
            async def wrapper(*args, **kwargs):
                start_time = time.time()
                
                try:
                    result = await func(*args, **kwargs)
                    
                    # Track success
                    duration = time.time() - start_time
                    self.db_query_duration_seconds.labels(
                        operation=operation,
                        table=table
                    ).observe(duration)
                    
                    self.db_queries_total.labels(
                        operation=operation,
                        table=table,
                        status="success"
                    ).inc()
                    
                    return result
                    
                except Exception as e:
                    # Track failure
                    duration = time.time() - start_time
                    self.db_query_duration_seconds.labels(
                        operation=operation,
                        table=table
                    ).observe(duration)
                    
                    self.db_queries_total.labels(
                        operation=operation,
                        table=table,
                        status="error"
                    ).inc()
                    
                    logger.error(
                        "db_query_failed",
                        operation=operation,
                        table=table,
                        error=str(e),
                        duration=duration
                    )
                    raise
            
            return wrapper
        return decorator
    
    @asynccontextmanager
    async def track_db_transaction(self, status: str = "committed"):
        """
        Context manager to track database transactions.
        
        Usage:
            async with metrics_service.track_db_transaction("committed"):
                # perform database operations
                ...
        """
        start_time = time.time()
        
        try:
            yield
            
            # Track success
            duration = time.time() - start_time
            self.db_transaction_duration_seconds.labels(
                status=status
            ).observe(duration)
            
        except Exception as e:
            # Track failure
            duration = time.time() - start_time
            self.db_transaction_duration_seconds.labels(
                status="rolled_back"
            ).observe(duration)
            
            logger.error(
                "db_transaction_failed",
                error=str(e),
                duration=duration
            )
            raise
    
    # ============================================================
    # MANUAL TRACKING METHODS
    # ============================================================
    
    def track_job_match(self, match_score: float):
        """Track a job match based on score"""
        if match_score >= 0.8:
            quality = "excellent"
        elif match_score >= 0.6:
            quality = "good"
        elif match_score >= 0.4:
            quality = "fair"
        else:
            quality = "poor"
        
        self.job_matches_total.labels(match_quality=quality).inc()
    
    def track_cache_operation(self, cache_type: str, hit: bool):
        """Track cache hit or miss"""
        if hit:
            self.cache_hits_total.labels(cache_type=cache_type).inc()
        else:
            self.cache_misses_total.labels(cache_type=cache_type).inc()
    
    def update_cache_size(self, cache_type: str, size_bytes: int):
        """Update cache size metric"""
        self.cache_size_bytes.labels(cache_type=cache_type).set(size_bytes)
    
    def track_cache_eviction(self, cache_type: str, reason: str = "size_limit"):
        """Track cache eviction"""
        self.cache_evictions_total.labels(
            cache_type=cache_type,
            reason=reason
        ).inc()
    
    def track_rate_limit(self, limiter_type: str, wait_time: float):
        """Track rate limit hit and wait time"""
        self.rate_limit_hits_total.labels(limiter_type=limiter_type).inc()
        self.rate_limit_wait_seconds.labels(limiter_type=limiter_type).observe(wait_time)
    
    def update_browser_sessions(self, count: int):
        """Update active browser sessions count"""
        self.browser_sessions_active.set(count)
    
    def update_db_connections(self, active: int, pool_size: int):
        """Update database connection metrics"""
        self.db_connections_active.set(active)
        self.db_connection_pool_size.set(pool_size)
    
    def update_memory_usage(self, rss: int, vms: int, shared: int = 0):
        """Update memory usage metrics"""
        self.memory_usage_bytes.labels(type="rss").set(rss)
        self.memory_usage_bytes.labels(type="vms").set(vms)
        if shared:
            self.memory_usage_bytes.labels(type="shared").set(shared)
    
    def set_application_info(self, version: str, environment: str, **kwargs):
        """Set application metadata"""
        info_dict = {
            'version': version,
            'environment': environment,
            **kwargs
        }
        self.application_info.info(info_dict)
    
    # ============================================================
    # METRICS EXPORT
    # ============================================================
    
    def generate_metrics(self) -> bytes:
        """
        Generate metrics in Prometheus format.
        
        Returns:
            Metrics as bytes in Prometheus text format
        """
        return generate_latest(self.registry)
    
    def get_content_type(self) -> str:
        """Get content type for metrics response"""
        return CONTENT_TYPE_LATEST
    
    # ============================================================
    # UTILITY METHODS
    # ============================================================
    
    def get_metrics_summary(self) -> dict:
        """Get a summary of current metrics (for debugging/testing)"""
        return {
            'total_jobs_scraped': self._get_counter_value(self.jobs_scraped_total),
            'total_sessions': self._get_counter_value(self.scraping_sessions_total),
            'active_sessions': self.active_scraping_sessions._value.get(),
            'db_queries': self._get_counter_value(self.db_queries_total),
            'cache_hits': self._get_counter_value(self.cache_hits_total),
            'cache_misses': self._get_counter_value(self.cache_misses_total),
            'errors': self._get_counter_value(self.scraping_errors_total),
        }
    
    def _get_counter_value(self, counter) -> float:
        """Helper to get total value from a counter"""
        try:
            total = 0
            for sample in counter.collect()[0].samples:
                if sample.name.endswith('_total'):
                    total += sample.value
            return total
        except:
            return 0.0


# Global metrics service instance
_metrics_service: Optional[MetricsService] = None


def get_metrics_service() -> MetricsService:
    """Get or create global metrics service instance"""
    global _metrics_service
    if _metrics_service is None:
        _metrics_service = MetricsService()
    return _metrics_service


def reset_metrics_service():
    """Reset global metrics service (useful for testing)"""
    global _metrics_service
    _metrics_service = None


# Example usage
if __name__ == "__main__":
    import asyncio
    
    async def example():
        # Get metrics service
        metrics = get_metrics_service()
        
        # Set application info
        metrics.set_application_info(
            version="1.0.0",
            environment="production",
            python_version="3.11"
        )
        
        # Track a scraping operation
        @metrics.track_scraping_operation("python_developer")
        async def scrape_jobs():
            await asyncio.sleep(1)  # Simulate scraping
            return {
                'jobs_scraped': 50,
                'new_jobs': 30,
                'updated_jobs': 15,
                'errors': 5
            }
        
        result = await scrape_jobs()
        print(f"Scraping result: {result}")
        
        # Track cache operations
        metrics.track_cache_operation("redis", hit=True)
        metrics.track_cache_operation("redis", hit=False)
        
        # Track job matches
        metrics.track_job_match(0.9)  # Excellent match
        metrics.track_job_match(0.7)  # Good match
        
        # Get metrics summary
        summary = metrics.get_metrics_summary()
        print(f"\nMetrics Summary: {summary}")
        
        # Generate Prometheus metrics
        print(f"\nPrometheus Metrics:\n{metrics.generate_metrics().decode()}")
    
    asyncio.run(example())
