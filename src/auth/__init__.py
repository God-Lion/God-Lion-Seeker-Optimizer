"""
Authentication module for various platforms.
"""
from .google_sso_auth import (
    GoogleSSOAuthenticator,
    GoogleSSOConfig,
    authenticate_indeed_with_google,
    authenticate_generic_with_google
)

__all__ = [
    'GoogleSSOAuthenticator',
    'GoogleSSOConfig',
    'authenticate_indeed_with_google',
    'authenticate_generic_with_google'
]
