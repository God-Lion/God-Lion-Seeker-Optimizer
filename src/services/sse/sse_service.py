"""
Core SSE Service

Generic, reusable Server-Sent Events service that manages connections,
broadcasting, and event streaming. This is the base layer that all
specific SSE implementations build upon.

Example Usage:
    ```python
    from services.sse import sse_service
    
    # Create a channel and connect clients
    queue = await sse_service.connect("my_channel")
    
    # Broadcast to all clients on the channel
    await sse_service.broadcast("my_channel", "update", {"status": "processing"})
    
    # Disconnect when done
    await sse_service.disconnect("my_channel", queue)
    ```
"""
import asyncio
import json
from typing import Dict, List, Optional, AsyncGenerator, Any
import structlog

from .types import SSEEvent, SSEMessage, SSEConfig

logger = structlog.get_logger(__name__)


class SSEService:
    """
    Core SSE service managing connections and broadcasts.
    
    This service handles:
    - Connection management (connect/disconnect)
    - Message broadcasting to channels
    - Heartbeat management for keeping connections alive
    - Automatic cleanup of dead connections
    """
    
    def __init__(self, config: Optional[SSEConfig] = None):
        """
        Initialize SSE service.
        
        Args:
            config: Optional SSE configuration. Uses defaults if not provided.
        """
        self.config = config or SSEConfig()
        self.connections: Dict[str, List[asyncio.Queue]] = {}
        self._heartbeat_tasks: Dict[asyncio.Queue, asyncio.Task] = {}
        logger.info("sse_service_initialized", config=self.config)
    
    async def connect(self, channel: str) -> asyncio.Queue:
        """
        Create a new SSE connection for a channel.
        
        Args:
            channel: The channel name to connect to
            
        Returns:
            asyncio.Queue: A queue that will receive SSE messages
        """
        if channel not in self.connections:
            self.connections[channel] = []
        
        queue = asyncio.Queue()
        self.connections[channel].append(queue)
        
        # Start heartbeat for this connection
        heartbeat_task = asyncio.create_task(self._send_heartbeat(queue))
        self._heartbeat_tasks[queue] = heartbeat_task
        
        logger.info(
            "sse_client_connected",
            channel=channel,
            total_connections=len(self.connections[channel])
        )
        return queue
    
    async def disconnect(self, channel: str, queue: asyncio.Queue):
        """
        Remove an SSE connection.
        
        Args:
            channel: The channel name
            queue: The queue to disconnect
        """
        # Cancel heartbeat task
        if queue in self._heartbeat_tasks:
            self._heartbeat_tasks[queue].cancel()
            del self._heartbeat_tasks[queue]
        
        # Remove from connections
        if channel in self.connections:
            if queue in self.connections[channel]:
                self.connections[channel].remove(queue)
                logger.info(
                    "sse_client_disconnected",
                    channel=channel,
                    remaining_connections=len(self.connections[channel])
                )
            
            # Clean up empty channels
            if not self.connections[channel]:
                del self.connections[channel]
                logger.debug("sse_channel_removed", channel=channel)
    
    async def broadcast(self, channel: str, event: str, data: Dict[str, Any]):
        """
        Broadcast a message to all clients on a channel.
        
        Args:
            channel: The channel to broadcast to
            event: The event type (e.g., "progress", "complete")
            data: The data payload to send
        """
        if channel not in self.connections:
            logger.debug("sse_broadcast_no_listeners", channel=channel)
            return
        
        message = SSEMessage(event=event, data=data)
        dead_queues = []
        
        for queue in self.connections[channel]:
            try:
                await asyncio.wait_for(
                    queue.put(message.to_dict()),
                    timeout=self.config.connection_timeout
                )
            except asyncio.TimeoutError:
                logger.warning("sse_broadcast_timeout", channel=channel)
                dead_queues.append(queue)
            except Exception as e:
                logger.error("sse_broadcast_failed", channel=channel, error=str(e))
                dead_queues.append(queue)
        
        # Clean up dead connections
        for queue in dead_queues:
            await self.disconnect(channel, queue)
        
        logger.debug(
            "sse_message_broadcast",
            channel=channel,
            event=event,
            clients=len(self.connections[channel])
        )
    
    async def broadcast_message(self, channel: str, message: SSEMessage):
        """
        Broadcast a structured SSE message.
        
        Args:
            channel: The channel to broadcast to
            message: The SSEMessage to send
        """
        await self.broadcast(channel, message.event, message.data)
    
    def get_channel_connections(self, channel: str) -> int:
        """
        Get the number of active connections for a channel.
        
        Args:
            channel: The channel name
            
        Returns:
            int: Number of active connections
        """
        return len(self.connections.get(channel, []))
    
    def get_all_channels(self) -> List[str]:
        """
        Get all active channel names.
        
        Returns:
            List[str]: List of channel names
        """
        return list(self.connections.keys())
    
    async def close_channel(self, channel: str):
        """
        Close all connections on a channel.
        
        Args:
            channel: The channel to close
        """
        if channel not in self.connections:
            return
        
        queues = list(self.connections[channel])  # Copy to avoid modification during iteration
        for queue in queues:
            await self.disconnect(channel, queue)
        
        logger.info("sse_channel_closed", channel=channel)
    
    async def _send_heartbeat(self, queue: asyncio.Queue):
        """
        Send periodic heartbeat to keep connection alive.
        
        Args:
            queue: The queue to send heartbeats to
        """
        try:
            while True:
                await asyncio.sleep(self.config.heartbeat_interval)
                await queue.put({
                    "event": SSEEvent.HEARTBEAT,
                    "data": {"timestamp": asyncio.get_event_loop().time()}
                })
        except asyncio.CancelledError:
            # Normal cancellation when client disconnects
            pass
        except Exception as e:
            logger.error("sse_heartbeat_error", error=str(e))
    
    def format_sse_message(self, event: str, data: Dict[str, Any]) -> str:
        """
        Format a message for SSE protocol.
        
        Args:
            event: The event type
            data: The data payload
            
        Returns:
            str: Formatted SSE message
        """
        json_data = json.dumps(data)
        return f"event: {event}\ndata: {json_data}\n\n"
    
    async def create_event_stream(
        self,
        channel: str,
        queue: asyncio.Queue
    ) -> AsyncGenerator[str, None]:
        """
        Create an async generator for SSE events.
        
        This is used to create the streaming response in FastAPI.
        
        Args:
            channel: The channel name
            queue: The connection queue
            
        Yields:
            str: Formatted SSE messages
        """
        try:
            # Send initial connection message
            yield self.format_sse_message(
                SSEEvent.CONNECTED,
                {"channel": channel, "status": "connected"}
            )
            
            while True:
                try:
                    # Wait for message with timeout
                    message = await asyncio.wait_for(
                        queue.get(),
                        timeout=self.config.connection_timeout
                    )
                    yield self.format_sse_message(message["event"], message["data"])
                except asyncio.TimeoutError:
                    # Keep connection alive during timeout
                    continue
                except asyncio.CancelledError:
                    break
                except Exception as e:
                    logger.error("sse_event_generation_error", error=str(e))
                    yield self.format_sse_message(
                        SSEEvent.ERROR,
                        {"message": str(e)}
                    )
                    break
        finally:
            await self.disconnect(channel, queue)
    
    def get_sse_headers(self) -> Dict[str, str]:
        """
        Get standard SSE response headers.
        
        Returns:
            Dict[str, str]: HTTP headers for SSE response
        """
        return {
            "Cache-Control": self.config.cache_control,
            "Connection": self.config.connection,
            "X-Accel-Buffering": self.config.x_accel_buffering
        }


# Global singleton instance
sse_service = SSEService()
