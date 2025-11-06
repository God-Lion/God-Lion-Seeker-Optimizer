"""CSP violation reporting endpoint"""
from fastapi import APIRouter, Request, HTTPException, status
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/security", tags=["Security"])


class CSPViolationReport(BaseModel):
    """Content Security Policy violation report"""
    document_uri: str
    referrer: Optional[str] = None
    violated_directive: str
    effective_directive: str
    original_policy: str
    disposition: str
    blocked_uri: str
    line_number: Optional[int] = None
    column_number: Optional[int] = None
    source_file: Optional[str] = None
    status_code: Optional[int] = None
    script_sample: Optional[str] = None


class CSPReportWrapper(BaseModel):
    """CSP report wrapper (browser sends in this format)"""
    csp_report: CSPViolationReport


@router.post("/csp-report")
async def report_csp_violation(request: Request):
    """
    Receive and log Content Security Policy violation reports
    
    Browsers send CSP violations to this endpoint for monitoring
    """
    try:
        # Parse CSP report
        body = await request.json()
        
        # Log the violation
        logger.warning(
            f"CSP Violation: {body.get('csp-report', {}).get('violated-directive')} "
            f"from {body.get('csp-report', {}).get('document-uri')}"
        )
        
        # In production, you might want to:
        # 1. Store violations in database for analysis
        # 2. Send alerts for critical violations
        # 3. Generate metrics/dashboards
        
        # Log full report for debugging
        logger.debug(f"Full CSP report: {body}")
        
        # Store in database (optional)
        # await store_csp_violation(body)
        
        return {"status": "received"}
    
    except Exception as e:
        logger.error(f"Failed to process CSP report: {e}")
        # Return 204 even on error (don't expose internal errors)
        return {"status": "error"}


@router.post("/report/csp")
async def report_csp_violation_alt(report: CSPReportWrapper):
    """
    Alternative CSP violation endpoint with validation
    """
    try:
        violation = report.csp_report
        
        logger.warning(
            f"CSP Violation Report:\n"
            f"  URI: {violation.document_uri}\n"
            f"  Violated Directive: {violation.violated_directive}\n"
            f"  Blocked URI: {violation.blocked_uri}\n"
            f"  Disposition: {violation.disposition}"
        )
        
        # TODO: Store in database for analysis
        # await save_csp_violation(violation)
        
        return {"status": "received", "timestamp": datetime.utcnow().isoformat()}
    
    except Exception as e:
        logger.error(f"CSP report processing error: {e}")
        return {"status": "error"}


@router.get("/security-headers-test")
async def test_security_headers(request: Request):
    """
    Test endpoint to verify security headers are being applied
    
    Returns information about the request headers
    """
    return {
        "headers_received": dict(request.headers),
        "secure_connection": request.url.scheme == "https",
        "client_host": request.client.host if request.client else None,
        "message": "Check response headers in browser developer tools"
    }


@router.get("/security-report")
async def get_security_report():
    """
    Get security configuration report
    
    IMPORTANT: This endpoint should be restricted to admins only in production
    """
    return {
        "security_features": {
            "hsts": {
                "enabled": True,
                "max_age": "1 year",
                "includeSubDomains": True,
                "preload": True
            },
            "csp": {
                "enabled": True,
                "reporting": True,
                "report_uri": "/api/security/csp-report"
            },
            "cors": {
                "enabled": True,
                "credentials": True
            },
            "headers": {
                "X-Content-Type-Options": "nosniff",
                "X-Frame-Options": "DENY",
                "X-XSS-Protection": "1; mode=block",
                "Referrer-Policy": "strict-origin-when-cross-origin",
                "Permissions-Policy": "enabled",
                "Cross-Origin-Embedder-Policy": "require-corp",
                "Cross-Origin-Opener-Policy": "same-origin",
                "Cross-Origin-Resource-Policy": "same-origin"
            }
        },
        "recommendations": [
            "Enable HTTPS in production",
            "Submit site to HSTS preload list",
            "Monitor CSP violations",
            "Regular security audits",
            "Update CSP to use nonces instead of unsafe-inline"
        ]
    }
