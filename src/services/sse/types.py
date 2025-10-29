"""
SSE Type Definitions

Type definitions and data classes for SSE functionality.
"""
from dataclasses import dataclass
from typing import Any, Dict, Optional
from enum import Enum


class SSEEvent(str, Enum):
    """Standard SSE event types"""
    CONNECTED = "connected"
    HEARTBEAT = "heartbeat"
    PROGRESS = "progress"
    STATUS_CHANGE = "status_change"
    COMPLETE = "complete"
    ERROR = "error"
    RESULT = "result"
    
    # Custom events can be added by extending this enum in specific services


@dataclass
class SSEMessage:
    """Structured SSE message"""
    event: str
    data: Dict[str, Any]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization"""
        return {
            "event": self.event,
            "data": self.data
        }


@dataclass
class SSEConfig:
    """SSE configuration options"""
    heartbeat_interval: int = 30  # seconds
    poll_interval: float = 2.0  # seconds for monitoring tasks
    max_reconnect_attempts: int = 10
    reconnect_delay: float = 1.0  # seconds
    connection_timeout: float = 1.0  # seconds for queue timeout
    
    # HTTP headers
    cache_control: str = "no-cache"
    connection: str = "keep-alive"
    x_accel_buffering: str = "no"  # Disable nginx buffering
