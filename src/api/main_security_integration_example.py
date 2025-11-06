"""
Example integration of security middleware into FastAPI application

Add this to your src/api/main.py
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.middleware.security_headers import (
    SecurityHeadersMiddleware,
    CSPNonceMiddleware,
    CORSSecurityMiddleware,
    get_security_middleware_config
)
from src.middleware.log_sanitization import setup_sanitized_logging
from src.api.routes import security
import os

# Initialize FastAPI app
app = FastAPI(
    title="God Lion Seeker Optimizer",
    version="1.0.0",
    description="Job Search Automation Platform"
)

# Get environment
environment = os.getenv("ENVIRONMENT", "development")

# ============================================================================
# SECURITY MIDDLEWARE (CRITICAL - Apply FIRST)
# ============================================================================

# 1. Security Headers Middleware (HSTS, CSP, etc.)
security_config = get_security_middleware_config(environment)
app.add_middleware(SecurityHeadersMiddleware, **security_config)

# 2. CSP Nonce Middleware (for inline scripts/styles)
# Uncomment when using nonces in templates
# app.add_middleware(CSPNonceMiddleware)

# 3. CORS Security Middleware
allowed_origins = [
    "http://localhost:3000",  # Development frontend
    "https://yourcompany.com",  # Production frontend
    "https://www.yourcompany.com",
]

# Only allow specific origins in production
if environment == "production":
    allowed_origins = [
        "https://yourcompany.com",
        "https://www.yourcompany.com"
    ]

app.add_middleware(
    CORSSecurityMiddleware,
    allowed_origins=allowed_origins,
    allowed_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowed_headers=["*"],
    expose_headers=["Content-Length", "Content-Type", "X-Request-ID"],
    allow_credentials=True,
    max_age=3600
)

# ============================================================================
# LOGGING & MONITORING
# ============================================================================

# Setup sanitized logging (PII removal)
setup_sanitized_logging(log_level=os.getenv("LOG_LEVEL", "INFO"))

# ============================================================================
# ROUTES
# ============================================================================

# Include security routes (CSP reporting, etc.)
app.include_router(security.router)

# Include your other routes
# app.include_router(auth.router)
# app.include_router(users.router)
# app.include_router(jobs.router)
# app.include_router(gdpr.router)

# ============================================================================
# STARTUP EVENTS
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Application startup"""
    from src.config.database import init_db
    
    # Initialize database
    await init_db()
    
    # Log security configuration
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"Application started in {environment} mode")
    logger.info("Security headers enabled: HSTS, CSP, CORS, and additional headers")
    
    if environment == "production":
        logger.info("Production security mode: HSTS enabled with preload")
    else:
        logger.warning(f"Running in {environment} mode - some security features may be disabled")


@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown"""
    from src.config.database import close_db
    
    await close_db()


# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    from src.config.database import health_check as db_health_check
    
    db_healthy = await db_health_check()
    
    return {
        "status": "healthy" if db_healthy else "degraded",
        "database": "connected" if db_healthy else "disconnected",
        "environment": environment
    }


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "God Lion Seeker Optimizer API",
        "version": "1.0.0",
        "environment": environment,
        "security": {
            "hsts": "enabled" if environment == "production" else "disabled",
            "csp": "enabled",
            "cors": "enabled"
        }
    }


# ============================================================================
# ERROR HANDLERS
# ============================================================================

from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request, exc):
    """Handle HTTP exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=exc.headers if hasattr(exc, 'headers') else None
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    """Handle validation errors"""
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()}
    )


if __name__ == "__main__":
    import uvicorn
    
    # Run with uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=environment == "development",
        log_level="info"
    )
