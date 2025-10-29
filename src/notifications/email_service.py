"""Email service for sending notifications"""
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from typing import List, Optional, Dict, Any
from pathlib import Path
import structlog
from datetime import datetime

logger = structlog.get_logger(__name__)


class EmailConfig:
    """Email configuration"""
    def __init__(
        self,
        smtp_server: str,
        smtp_port: int,
        sender_email: str,
        sender_password: str,
        sender_name: str = "God Lion Seeker Optimizer",
        use_tls: bool = True,
        use_ssl: bool = False
    ):
        self.smtp_server = smtp_server
        self.smtp_port = smtp_port
        self.sender_email = sender_email
        self.sender_password = sender_password
        self.sender_name = sender_name
        self.use_tls = use_tls
        self.use_ssl = use_ssl


class EmailService:
    """Service for sending email notifications"""
    
    def __init__(self, config: EmailConfig):
        """Initialize email service
        
        Args:
            config: Email configuration
        """
        self.config = config
        self._validate_config()
    
    def _validate_config(self):
        """Validate email configuration"""
        if not self.config.smtp_server:
            raise ValueError("SMTP server is required")
        if not self.config.sender_email:
            raise ValueError("Sender email is required")
        if not self.config.sender_password:
            raise ValueError("Sender password is required")
    
    def send_email(
        self,
        to_emails: List[str],
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        cc_emails: Optional[List[str]] = None,
        bcc_emails: Optional[List[str]] = None,
        attachments: Optional[List[Path]] = None,
        reply_to: Optional[str] = None
    ) -> bool:
        """Send an email
        
        Args:
            to_emails: List of recipient emails
            subject: Email subject
            html_content: HTML content of the email
            text_content: Plain text alternative (optional)
            cc_emails: CC recipients (optional)
            bcc_emails: BCC recipients (optional)
            attachments: List of file paths to attach (optional)
            reply_to: Reply-to address (optional)
        
        Returns:
            True if successful, False otherwise
        """
        try:
            # Create message
            message = MIMEMultipart('alternative')
            message['Subject'] = subject
            message['From'] = f"{self.config.sender_name} <{self.config.sender_email}>"
            message['To'] = ', '.join(to_emails)
            
            if cc_emails:
                message['Cc'] = ', '.join(cc_emails)
            
            if reply_to:
                message['Reply-To'] = reply_to
            
            message['Date'] = datetime.now().strftime('%a, %d %b %Y %H:%M:%S %z')
            
            # Add text part
            if text_content:
                text_part = MIMEText(text_content, 'plain', 'utf-8')
                message.attach(text_part)
            
            # Add HTML part
            html_part = MIMEText(html_content, 'html', 'utf-8')
            message.attach(html_part)
            
            # Add attachments
            if attachments:
                for attachment_path in attachments:
                    self._add_attachment(message, attachment_path)
            
            # Send email
            self._send_message(message, to_emails, cc_emails, bcc_emails)
            
            logger.info(
                "email_sent_successfully",
                to=to_emails,
                subject=subject,
                has_attachments=bool(attachments)
            )
            return True
        
        except Exception as e:
            logger.error(
                "email_send_failed",
                to=to_emails,
                subject=subject,
                error=str(e),
                exc_info=True
            )
            return False
    
    def _add_attachment(self, message: MIMEMultipart, file_path: Path):
        """Add file attachment to message
        
        Args:
            message: Email message
            file_path: Path to file to attach
        """
        try:
            with open(file_path, 'rb') as f:
                part = MIMEBase('application', 'octet-stream')
                part.set_payload(f.read())
            
            encoders.encode_base64(part)
            part.add_header(
                'Content-Disposition',
                f'attachment; filename= {file_path.name}'
            )
            message.attach(part)
        
        except Exception as e:
            logger.error(
                "attachment_failed",
                file=str(file_path),
                error=str(e)
            )
    
    def _send_message(
        self,
        message: MIMEMultipart,
        to_emails: List[str],
        cc_emails: Optional[List[str]] = None,
        bcc_emails: Optional[List[str]] = None
    ):
        """Send the email message
        
        Args:
            message: Email message to send
            to_emails: List of recipient emails
            cc_emails: CC recipients
            bcc_emails: BCC recipients
        """
        # Combine all recipients
        all_recipients = to_emails.copy()
        if cc_emails:
            all_recipients.extend(cc_emails)
        if bcc_emails:
            all_recipients.extend(bcc_emails)
        
        # Connect and send
        if self.config.use_ssl:
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(
                self.config.smtp_server,
                self.config.smtp_port,
                context=context
            ) as server:
                server.login(self.config.sender_email, self.config.sender_password)
                server.sendmail(
                    self.config.sender_email,
                    all_recipients,
                    message.as_string()
                )
        else:
            with smtplib.SMTP(self.config.smtp_server, self.config.smtp_port) as server:
                if self.config.use_tls:
                    context = ssl.create_default_context()
                    server.starttls(context=context)
                
                server.login(self.config.sender_email, self.config.sender_password)
                server.sendmail(
                    self.config.sender_email,
                    all_recipients,
                    message.as_string()
                )
    
    def send_test_email(self, to_email: str) -> bool:
        """Send a test email to verify configuration
        
        Args:
            to_email: Recipient email address
        
        Returns:
            True if successful, False otherwise
        """
        subject = "Test Email from God Lion Seeker Optimizer"
        html_content = """
        <html>
            <body style="font-family: Arial, sans-serif;">
                <h2 style="color: #0077B5;">Test Email</h2>
                <p>This is a test email from your God Lion Seeker Optimizer.</p>
                <p>If you received this email, your email configuration is working correctly!</p>
                <hr>
                <p style="color: #666; font-size: 12px;">
                    Sent at: {timestamp}
                </p>
            </body>
        </html>
        """.format(timestamp=datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
        
        text_content = f"""
        Test Email from God Lion Seeker Optimizer
        
        This is a test email from your God Lion Seeker Optimizer.
        If you received this email, your email configuration is working correctly!
        
        Sent at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
        """
        
        return self.send_email(
            to_emails=[to_email],
            subject=subject,
            html_content=html_content,
            text_content=text_content
        )
    
    def send_bulk_email(
        self,
        recipients: List[Dict[str, str]],
        subject_template: str,
        html_template: str,
        text_template: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send personalized emails to multiple recipients
        
        Args:
            recipients: List of dicts with 'email' and other personalization data
            subject_template: Subject with placeholders like {name}
            html_template: HTML template with placeholders
            text_template: Text template with placeholders (optional)
        
        Returns:
            Dict with success count and failed emails
        """
        results = {
            'success_count': 0,
            'failed_count': 0,
            'failed_emails': []
        }
        
        for recipient in recipients:
            try:
                email = recipient['email']
                
                # Format templates with recipient data
                subject = subject_template.format(**recipient)
                html_content = html_template.format(**recipient)
                text_content = text_template.format(**recipient) if text_template else None
                
                # Send email
                if self.send_email(
                    to_emails=[email],
                    subject=subject,
                    html_content=html_content,
                    text_content=text_content
                ):
                    results['success_count'] += 1
                else:
                    results['failed_count'] += 1
                    results['failed_emails'].append(email)
            
            except Exception as e:
                logger.error(
                    "bulk_email_failed",
                    email=recipient.get('email'),
                    error=str(e)
                )
                results['failed_count'] += 1
                results['failed_emails'].append(recipient.get('email', 'unknown'))
        
        logger.info(
            "bulk_email_completed",
            total=len(recipients),
            success=results['success_count'],
            failed=results['failed_count']
        )
        
        return results
