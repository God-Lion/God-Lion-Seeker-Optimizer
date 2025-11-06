"""Security headers middleware for FastAPI application"""
from fastapi import Request, Response
from fastapi.middleware.base import BaseHTTPMiddleware
from typing import Callable, Optional
import logging
from datetime import timedelta

logger = logging.getLogger(__name__)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware to add security headers to all HTTP responses
    
    Implements:
    - HSTS (HTTP Strict Transport Security)
    - Content Security Policy (CSP)
    - X-Content-Type-Options
    - X-Frame-Options
    - X-XSS-Protection
    - Referrer-Policy
    - Permissions-Policy
    - Cross-Origin policies
    """
    
    def __init__(
        self,
        app,
        hsts_enabled: bool = True,
        hsts_max_age: int = 31536000,  # 1 year
        hsts_include_subdomains: bool = True,
        hsts_preload: bool = True,
        csp_enabled: bool = True,
        csp_directives: Optional[dict] = None,
        csp_report_uri: Optional[str] = None,
        environment: str = "production"
    ):
        """
        Initialize security headers middleware
        
        Args:
            app: FastAPI application
            hsts_enabled: Enable HSTS header
            hsts_max_age: HSTS max-age in seconds (default: 1 year)
            hsts_include_subdomains: Include subdomains in HSTS
            hsts_preload: Enable HSTS preload
            csp_enabled: Enable Content Security Policy
            csp_directives: Custom CSP directives
            csp_report_uri: URI for CSP violation reports
            environment: Application environment (production/development)
        """
        super().__init__(app)
        
        self.hsts_enabled = hsts_enabled
        self.hsts_max_age = hsts_max_age
        self.hsts_include_subdomains = hsts_include_subdomains
        self.hsts_preload = hsts_preload
        
        self.csp_enabled = csp_enabled
        self.csp_directives = csp_directives or self._default_csp_directives()
        self.csp_report_uri = csp_report_uri
        
        self.environment = environment
        
        logger.info(
            f"Security headers middleware initialized: "
            f"HSTS={hsts_enabled}, CSP={csp_enabled}, env={environment}"
        )
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Process request and add security headers to response
        
        Args:
            request: HTTP request
            call_next: Next middleware/endpoint
            
        Returns:
            HTTP response with security headers
        """
        response = await call_next(request)
        
        # Add security headers
        self._add_hsts_header(response, request)
        self._add_csp_header(response)
        self._add_content_type_options(response)
        self._add_frame_options(response)
        self._add_xss_protection(response)
        self._add_referrer_policy(response)
        self._add_permissions_policy(response)
        self._add_cross_origin_policies(response)
        self._add_additional_headers(response)
        
        return response
    
    def _add_hsts_header(self, response: Response, request: Request) -> None:
        """
        Add HTTP Strict Transport Security (HSTS) header
        
        CRITICAL: Forces HTTPS, prevents protocol downgrade attacks
        """
        if not self.hsts_enabled:
            return
        
        # Only add HSTS on HTTPS connections
        # In production, this should always be HTTPS
        is_https = (
            request.url.scheme == "https" or
            request.headers.get("x-forwarded-proto") == "https"
        )
        
        if is_https or self.environment == "production":
            hsts_value = f"max-age={self.hsts_max_age}"
            
            if self.hsts_include_subdomains:
                hsts_value += "; includeSubDomains"
            
            if self.hsts_preload:
                hsts_value += "; preload"
            
            response.headers["Strict-Transport-Security"] = hsts_value
            
            logger.debug(f"HSTS header added: {hsts_value}")
    
    def _add_csp_header(self, response: Response) -> None:
        """
        Add Content Security Policy (CSP) header
        
        HIGH PRIORITY: Prevents XSS attacks, controls resource loading
        """
        if not self.csp_enabled:
            return
        
        # Build CSP header from directives
        csp_parts = []
        
        for directive, values in self.csp_directives.items():
            if isinstance(values, list):
                values_str = " ".join(values)
            else:
                values_str = values
            
            csp_parts.append(f"{directive} {values_str}")
        
        # Add report-uri if configured
        if self.csp_report_uri:
            csp_parts.append(f"report-uri {self.csp_report_uri}")
        
        csp_value = "; ".join(csp_parts)
        
        # Use Content-Security-Policy-Report-Only in development for testing
        header_name = "Content-Security-Policy"
        if self.environment == "development":
            header_name = "Content-Security-Policy-Report-Only"
        
        response.headers[header_name] = csp_value
        
        logger.debug(f"CSP header added: {header_name}")
    
    def _add_content_type_options(self, response: Response) -> None:
        """
        Add X-Content-Type-Options header
        
        Prevents MIME type sniffing
        """
        response.headers["X-Content-Type-Options"] = "nosniff"
    
    def _add_frame_options(self, response: Response) -> None:
        """
        Add X-Frame-Options header
        
        Prevents clickjacking attacks
        """
        response.headers["X-Frame-Options"] = "DENY"
    
    def _add_xss_protection(self, response: Response) -> None:
        """
        Add X-XSS-Protection header
        
        Legacy XSS protection (for older browsers)
        """
        response.headers["X-XSS-Protection"] = "1; mode=block"
    
    def _add_referrer_policy(self, response: Response) -> None:
        """
        Add Referrer-Policy header
        
        Controls referrer information sent with requests
        """
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    def _add_permissions_policy(self, response: Response) -> None:
        """
        Add Permissions-Policy header (formerly Feature-Policy)
        
        MEDIUM PRIORITY: Controls browser features and APIs
        """
        # Restrict permissions for privacy and security
        permissions = [
            "geolocation=()",           # Disable geolocation
            "microphone=()",            # Disable microphone
            "camera=()",                # Disable camera
            "payment=()",               # Disable payment APIs
            "usb=()",                   # Disable USB
            "magnetometer=()",          # Disable magnetometer
            "gyroscope=()",             # Disable gyroscope
            "accelerometer=()",         # Disable accelerometer
            "ambient-light-sensor=()",  # Disable ambient light sensor
            "autoplay=()",              # Disable autoplay
            "encrypted-media=()",       # Disable encrypted media
            "fullscreen=(self)",        # Allow fullscreen on same origin
            "picture-in-picture=()",    # Disable picture-in-picture
            "screen-wake-lock=()",      # Disable screen wake lock
            "web-share=()",             # Disable web share
        ]
        
        response.headers["Permissions-Policy"] = ", ".join(permissions)
        
        logger.debug("Permissions-Policy header added")
    
    def _add_cross_origin_policies(self, response: Response) -> None:
        """
        Add Cross-Origin policies
        
        MEDIUM PRIORITY: Cross-origin security
        """
        # Cross-Origin-Embedder-Policy (COEP)
        # Prevents loading cross-origin resources without explicit permission
        response.headers["Cross-Origin-Embedder-Policy"] = "require-corp"
        
        # Cross-Origin-Opener-Policy (COOP)
        # Isolates browsing context from cross-origin windows
        response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
        
        # Cross-Origin-Resource-Policy (CORP)
        # Prevents other origins from reading the response
        response.headers["Cross-Origin-Resource-Policy"] = "same-origin"
        
        logger.debug("Cross-Origin policies added")
    
    def _add_additional_headers(self, response: Response) -> None:
        """
        Add additional security headers
        
        MEDIUM PRIORITY: Additional security measures
        """
        # X-Permitted-Cross-Domain-Policies
        # Restricts Adobe Flash and PDF cross-domain policies
        response.headers["X-Permitted-Cross-Domain-Policies"] = "none"
        
        # X-DNS-Prefetch-Control
        # Controls DNS prefetching
        response.headers["X-DNS-Prefetch-Control"] = "off"
        
        # X-Download-Options
        # Prevents IE from executing downloads in site's context
        response.headers["X-Download-Options"] = "noopen"
        
        logger.debug("Additional security headers added")
    
    def _default_csp_directives(self) -> dict:
        """
        Get default Content Security Policy directives
        
        Returns:
            Dictionary of CSP directives
        """
        return {
            # Default source - restrictive by default
            "default-src": ["'self'"],
            
            # Scripts - allow self and inline (for frameworks)
            # In production, remove 'unsafe-inline' and use nonces
            "script-src": [
                "'self'",
                "'unsafe-inline'",  # TODO: Replace with nonce in production
                "'unsafe-eval'",    # TODO: Remove in production if possible
                "https://cdn.jsdelivr.net",  # For CDN scripts if needed
            ],
            
            # Styles - allow self and inline
            "style-src": [
                "'self'",
                "'unsafe-inline'",
                "https://fonts.googleapis.com",
            ],
            
            # Images - allow self, data URLs, and specific domains
            "img-src": [
                "'self'",
                "data:",
                "https:",
                "blob:",
            ],
            
            # Fonts - allow self and Google Fonts
            "font-src": [
                "'self'",
                "data:",
                "https://fonts.gstatic.com",
            ],
            
            # API connections
            "connect-src": [
                "'self'",
                "https://api.yourcompany.com",  # Your API domain
            ],
            
            # Media sources
            "media-src": ["'self'"],
            
            # Object/embed sources (Flash, etc.) - block completely
            "object-src": ["'none'"],
            
            # Frame sources - block iframes from other origins
            "frame-src": ["'none'"],
            
            # Frame ancestors - prevent being embedded
            "frame-ancestors": ["'none'"],
            
            # Form actions - only allow posting to self
            "form-action": ["'self'"],
            
            # Base URI - restrict base tag
            "base-uri": ["'self'"],
            
            # Upgrade insecure requests (HTTP to HTTPS)
            "upgrade-insecure-requests": "",
            
            # Block mixed content
            "block-all-mixed-content": "",
        }


class CSPNonceMiddleware(BaseHTTPMiddleware):
    """
    Middleware to inject CSP nonce into templates
    
    More secure alternative to 'unsafe-inline'
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Generate nonce and add to request state
        
        Args:
            request: HTTP request
            call_next: Next middleware/endpoint
            
        Returns:
            HTTP response
        """
        import secrets
        
        # Generate random nonce
        nonce = secrets.token_urlsafe(16)
        
        # Store nonce in request state for use in templates
        request.state.csp_nonce = nonce
        
        # Process request
        response = await call_next(request)
        
        # Add nonce to CSP header if CSP exists
        if "Content-Security-Policy" in response.headers:
            csp = response.headers["Content-Security-Policy"]
            
            # Replace 'unsafe-inline' with nonce
            csp = csp.replace("'unsafe-inline'", f"'nonce-{nonce}'")
            
            response.headers["Content-Security-Policy"] = csp
        
        return response


class CORSSecurityMiddleware(BaseHTTPMiddleware):
    """
    Enhanced CORS middleware with security controls
    """
    
    def __init__(
        self,
        app,
        allowed_origins: list[str] = None,
        allowed_methods: list[str] = None,
        allowed_headers: list[str] = None,
        expose_headers: list[str] = None,
        allow_credentials: bool = True,
        max_age: int = 3600
    ):
        """
        Initialize CORS middleware
        
        Args:
            app: FastAPI application
            allowed_origins: List of allowed origins
            allowed_methods: List of allowed HTTP methods
            allowed_headers: List of allowed headers
            expose_headers: List of headers to expose
            allow_credentials: Allow credentials
            max_age: Preflight cache duration
        """
        super().__init__(app)
        
        self.allowed_origins = allowed_origins or ["http://localhost:3000"]
        self.allowed_methods = allowed_methods or ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
        self.allowed_headers = allowed_headers or ["*"]
        self.expose_headers = expose_headers or ["Content-Length", "Content-Type"]
        self.allow_credentials = allow_credentials
        self.max_age = max_age
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Handle CORS requests
        
        Args:
            request: HTTP request
            call_next: Next middleware/endpoint
            
        Returns:
            HTTP response with CORS headers
        """
        origin = request.headers.get("origin")
        
        # Handle preflight requests
        if request.method == "OPTIONS":
            response = Response()
            self._add_cors_headers(response, origin)
            return response
        
        # Process normal request
        response = await call_next(request)
        
        # Add CORS headers
        self._add_cors_headers(response, origin)
        
        return response
    
    def _add_cors_headers(self, response: Response, origin: Optional[str]) -> None:
        """
        Add CORS headers to response
        
        Args:
            response: HTTP response
            origin: Request origin
        """
        # Check if origin is allowed
        if origin and (origin in self.allowed_origins or "*" in self.allowed_origins):
            response.headers["Access-Control-Allow-Origin"] = origin
        
        # Add other CORS headers
        response.headers["Access-Control-Allow-Methods"] = ", ".join(self.allowed_methods)
        response.headers["Access-Control-Allow-Headers"] = ", ".join(self.allowed_headers)
        response.headers["Access-Control-Expose-Headers"] = ", ".join(self.expose_headers)
        
        if self.allow_credentials:
            response.headers["Access-Control-Allow-Credentials"] = "true"
        
        response.headers["Access-Control-Max-Age"] = str(self.max_age)


def get_security_middleware_config(environment: str = "production") -> dict:
    """
    Get security middleware configuration based on environment
    
    Args:
        environment: Environment name (production/development/staging)
        
    Returns:
        Configuration dictionary
    """
    if environment == "production":
        return {
            "hsts_enabled": True,
            "hsts_max_age": 31536000,  # 1 year
            "hsts_include_subdomains": True,
            "hsts_preload": True,
            "csp_enabled": True,
            "csp_directives": None,  # Use defaults
            "csp_report_uri": "https://yourcompany.com/api/csp-report",
            "environment": "production"
        }
    
    elif environment == "staging":
        return {
            "hsts_enabled": True,
            "hsts_max_age": 86400,  # 1 day
            "hsts_include_subdomains": False,
            "hsts_preload": False,
            "csp_enabled": True,
            "csp_directives": None,
            "csp_report_uri": "https://staging.yourcompany.com/api/csp-report",
            "environment": "staging"
        }
    
    else:  # development
        return {
            "hsts_enabled": False,  # Allow HTTP in development
            "hsts_max_age": 0,
            "hsts_include_subdomains": False,
            "hsts_preload": False,
            "csp_enabled": True,  # Still test CSP
            "csp_directives": None,
            "csp_report_uri": None,
            "environment": "development"
        }
