"""Notification system for job scraper"""
from .email_service import EmailService
from .email_templates import EmailTemplateGenerator
from .notification_manager import NotificationManager

__all__ = [
    'EmailService',
    'EmailTemplateGenerator',
    'NotificationManager'
]
