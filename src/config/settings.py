"""Application settings using Pydantic"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
from pathlib import Path


class Settings(BaseSettings):
    """Application settings using Pydantic"""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    # Application
    app_name: str = "God Lion Seeker Optimizer"
    app_version: str = "1.0.0"
    debug: bool = False
    environment: str = "development"
    
    # Database URL (priority)
    database_url: Optional[str] = None

    # Database (MySQL fallback)
    db_host: str = "localhost"
    db_port: int = 3306
    db_user: str = "root"
    db_password: str = "root"
    db_name: str = "godlionseeker_db"
    db_pool_size: int = 10
    db_max_overflow: int = 20
    
    # PostgreSQL (if migrating)
    postgres_host: Optional[str] = None
    postgres_port: int = 5432
    postgres_user: Optional[str] = None
    postgres_password: Optional[str] = None
    postgres_db: Optional[str] = None
    
    # LinkedIn
    li_at_cookie: Optional[str] = None
    
    # Scraping
    scrape_headless: bool = True
    scrape_slow_mo: float = 1.0
    scrape_timeout: int = 40
    scrape_max_workers: int = 3
    
    # Resume
    resume_path: Path = Path("my_resume.txt")
    
    # Redis Configuration
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_db: int = 0
    redis_password: Optional[str] = None
    redis_socket_timeout: int = 5
    redis_socket_connect_timeout: int = 5
    redis_max_connections: int = 20
    
    # Cache TTL Settings (in seconds)
    cache_job_ttl: int = 86400  # 24 hours
    cache_search_ttl: int = 3600  # 1 hour
    cache_company_ttl: int = 604800  # 7 days
    cache_session_ttl: int = 3600  # 1 hour
    
    # Logging
    log_level: str = "INFO"
    log_format: str = "json"
    
    # Email Notifications
    email_enabled: bool = False
    smtp_server: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_use_tls: bool = True
    smtp_use_ssl: bool = False
    sender_email: str = ""
    sender_password: str = ""
    sender_name: str = "God Lion Seeker Optimizer"
    recipient_emails: str = ""
    
    # Notification Settings
    notify_on_new_jobs: bool = True
    notify_on_high_matches: bool = True
    send_daily_summary: bool = True
    notify_on_errors: bool = True
    high_match_threshold: float = 75.0
    summary_time: str = "18:00"
    min_jobs_for_notification: int = 1
    max_jobs_per_email: int = 20
    
    # JWT Authentication
    jwt_secret_key: str = "your-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60  # 1 hour
    jwt_refresh_token_expire_days: int = 30  # 30 days
    
    # Security
    password_min_length: int = 8
    max_login_attempts: int = 3
    account_lockout_duration_minutes: int = 30
    
    # Encryption
    encryption_key: Optional[str] = None
    file_encryption_key: Optional[str] = None
    encryption_enabled: bool = True
    
    # Redis Security
    redis_use_tls: bool = False
    redis_ssl_cert_reqs: str = "required"
    redis_ssl_ca_certs: Optional[str] = None
    redis_ssl_certfile: Optional[str] = None
    redis_ssl_keyfile: Optional[str] = None
    
    # Frontend URL (for email links)
    frontend_url: str = "http://localhost:3000"
    
    @property
    def recipient_email_list(self) -> list:
        """Get list of recipient emails"""
        if not self.recipient_emails:
            return []
        return [email.strip() for email in self.recipient_emails.split(',')]
    
    @property
    def effective_database_url(self) -> str:
        """Get SQLAlchemy database URL, prioritizing DATABASE_URL env var."""
        if self.database_url:
            return self.database_url
        if self.postgres_user and self.postgres_password:
            return (
                f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
                f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
            )
        return (
            f"mysql+aiomysql://{self.db_user}:{self.db_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
            f"?charset=utf8mb4"
        )
    
    @property
    def sync_database_url(self) -> str:
        """Get synchronous database URL, prioritizing DATABASE_URL env var."""
        if self.database_url:
            # Replace async driver with sync driver
            return self.database_url.replace("asyncpg", "psycopg2").replace("aiomysql", "pymysql")
        if self.postgres_user and self.postgres_password:
            return (
                f"postgresql+psycopg2://{self.postgres_user}:{self.postgres_password}"
                f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
            )
        return (
            f"mysql+pymysql://{self.db_user}:{self.db_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
            f"?charset=utf8mb4"
        )
    
    @property
    def postgres_url(self) -> Optional[str]:
        """Get PostgreSQL URL if configured"""
        if self.postgres_user and self.postgres_password:
            return (
                f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
                f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
            )
        return None


# Global settings instance
settings = Settings()
