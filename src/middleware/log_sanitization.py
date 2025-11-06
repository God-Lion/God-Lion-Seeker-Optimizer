"""Log sanitization middleware for PII protection"""
import re
import logging
from typing import Any, Dict
import json


class PIISanitizer:
    """Sanitize PII from logs and error messages"""
    
    # Regex patterns for common PII
    EMAIL_PATTERN = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
    PHONE_PATTERN = re.compile(r'\b(?:\+?1[-.]?)?\(?([0-9]{3})\)?[-.]?([0-9]{3})[-.]?([0-9]{4})\b')
    SSN_PATTERN = re.compile(r'\b\d{3}-\d{2}-\d{4}\b')
    CREDIT_CARD_PATTERN = re.compile(r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b')
    IP_ADDRESS_PATTERN = re.compile(r'\b(?:\d{1,3}\.){3}\d{1,3}\b')
    
    # Sensitive field names
    SENSITIVE_FIELDS = {
        'password', 'passwd', 'pwd', 'secret', 'token', 'api_key', 'apikey',
        'access_token', 'refresh_token', 'auth', 'authorization', 'credential',
        'email', 'phone', 'ssn', 'social_security', 'credit_card', 'cvv',
        'first_name', 'last_name', 'full_name', 'address', 'street', 'city',
        'postal_code', 'zip_code', 'ip_address', 'user_agent', 'mfa_secret',
        'recovery_code', 'google_id'
    }
    
    @classmethod
    def sanitize_text(cls, text: str) -> str:
        """
        Sanitize PII from text
        
        Args:
            text: Text to sanitize
            
        Returns:
            Sanitized text with PII masked
        """
        if not text:
            return text
        
        # Mask emails
        text = cls.EMAIL_PATTERN.sub('[EMAIL_REDACTED]', text)
        
        # Mask phone numbers
        text = cls.PHONE_PATTERN.sub('[PHONE_REDACTED]', text)
        
        # Mask SSN
        text = cls.SSN_PATTERN.sub('[SSN_REDACTED]', text)
        
        # Mask credit cards
        text = cls.CREDIT_CARD_PATTERN.sub('[CARD_REDACTED]', text)
        
        # Mask IP addresses (partial - keep first two octets)
        text = cls.IP_ADDRESS_PATTERN.sub(lambda m: '.'.join(m.group().split('.')[:2] + ['***', '***']), text)
        
        return text
    
    @classmethod
    def sanitize_dict(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sanitize PII from dictionary
        
        Args:
            data: Dictionary to sanitize
            
        Returns:
            Sanitized dictionary
        """
        if not isinstance(data, dict):
            return data
        
        sanitized = {}
        
        for key, value in data.items():
            key_lower = key.lower()
            
            # Check if field is sensitive
            if any(sensitive in key_lower for sensitive in cls.SENSITIVE_FIELDS):
                sanitized[key] = '[REDACTED]'
            elif isinstance(value, dict):
                sanitized[key] = cls.sanitize_dict(value)
            elif isinstance(value, list):
                sanitized[key] = [cls.sanitize_dict(item) if isinstance(item, dict) else item for item in value]
            elif isinstance(value, str):
                sanitized[key] = cls.sanitize_text(value)
            else:
                sanitized[key] = value
        
        return sanitized
    
    @classmethod
    def sanitize_log_record(cls, record: logging.LogRecord) -> None:
        """
        Sanitize PII from log record in-place
        
        Args:
            record: Log record to sanitize
        """
        if hasattr(record, 'msg') and isinstance(record.msg, str):
            record.msg = cls.sanitize_text(record.msg)
        
        if hasattr(record, 'args') and record.args:
            sanitized_args = []
            for arg in record.args:
                if isinstance(arg, dict):
                    sanitized_args.append(cls.sanitize_dict(arg))
                elif isinstance(arg, str):
                    sanitized_args.append(cls.sanitize_text(arg))
                else:
                    sanitized_args.append(arg)
            record.args = tuple(sanitized_args)


class PIISanitizingFilter(logging.Filter):
    """Logging filter to sanitize PII from log records"""
    
    def filter(self, record: logging.LogRecord) -> bool:
        """
        Filter and sanitize log record
        
        Args:
            record: Log record to filter
            
        Returns:
            True to keep the record
        """
        PIISanitizer.sanitize_log_record(record)
        return True


class SanitizedJSONFormatter(logging.Formatter):
    """JSON formatter with PII sanitization"""
    
    def format(self, record: logging.LogRecord) -> str:
        """
        Format log record as sanitized JSON
        
        Args:
            record: Log record to format
            
        Returns:
            JSON-formatted log string
        """
        # Sanitize record
        PIISanitizer.sanitize_log_record(record)
        
        # Create log entry
        log_entry = {
            'timestamp': self.formatTime(record),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno
        }
        
        # Add exception info if present
        if record.exc_info:
            log_entry['exception'] = self.formatException(record.exc_info)
        
        # Add extra fields
        if hasattr(record, 'extra'):
            log_entry['extra'] = PIISanitizer.sanitize_dict(record.extra)
        
        return json.dumps(log_entry)


def setup_sanitized_logging(log_level: str = "INFO") -> None:
    """
    Configure logging with PII sanitization
    
    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    """
    # Create root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level.upper()))
    
    # Remove existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Create console handler with sanitization
    console_handler = logging.StreamHandler()
    console_handler.setLevel(getattr(logging, log_level.upper()))
    
    # Add PII sanitizing filter
    console_handler.addFilter(PIISanitizingFilter())
    
    # Use JSON formatter with sanitization
    formatter = SanitizedJSONFormatter()
    console_handler.setFormatter(formatter)
    
    root_logger.addHandler(console_handler)
    
    logging.info("Logging configured with PII sanitization")


class RequestLogSanitizer:
    """Sanitize PII from HTTP request logs"""
    
    SENSITIVE_HEADERS = {
        'authorization', 'cookie', 'x-api-key', 'x-auth-token',
        'x-access-token', 'x-refresh-token'
    }
    
    SENSITIVE_QUERY_PARAMS = {
        'token', 'api_key', 'access_token', 'refresh_token',
        'email', 'password', 'secret'
    }
    
    @classmethod
    def sanitize_headers(cls, headers: Dict[str, str]) -> Dict[str, str]:
        """
        Sanitize sensitive headers
        
        Args:
            headers: Request headers
            
        Returns:
            Sanitized headers
        """
        sanitized = {}
        
        for key, value in headers.items():
            if key.lower() in cls.SENSITIVE_HEADERS:
                sanitized[key] = '[REDACTED]'
            else:
                sanitized[key] = value
        
        return sanitized
    
    @classmethod
    def sanitize_query_params(cls, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sanitize sensitive query parameters
        
        Args:
            params: Query parameters
            
        Returns:
            Sanitized parameters
        """
        sanitized = {}
        
        for key, value in params.items():
            if key.lower() in cls.SENSITIVE_QUERY_PARAMS:
                sanitized[key] = '[REDACTED]'
            else:
                sanitized[key] = value
        
        return sanitized
    
    @classmethod
    def sanitize_request_body(cls, body: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sanitize sensitive fields from request body
        
        Args:
            body: Request body
            
        Returns:
            Sanitized body
        """
        return PIISanitizer.sanitize_dict(body)
