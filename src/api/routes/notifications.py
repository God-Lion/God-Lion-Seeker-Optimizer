"""
Notifications Routes
Handles user notifications and preferences
"""
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc

from src.config.database import get_db
from src.models.user import User, Notification
from src.auth.dependencies import get_current_active_user

router = APIRouter()


# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, WebSocket] = {}
    
    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket
    
    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
    
    async def send_notification(self, user_id: int, notification: dict):
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_json(notification)
            except:
                self.disconnect(user_id)


manager = ConnectionManager()


# Pydantic Models
class NotificationResponse(BaseModel):
    id: int
    type: str
    title: str
    message: str
    read: bool
    created_at: datetime
    action_url: Optional[str] = None
    action_label: Optional[str] = None
    metadata: Optional[dict] = None
    
    class Config:
        from_attributes = True


class NotificationsListResponse(BaseModel):
    notifications: List[NotificationResponse]
    unread_count: int
    total: int


class NotificationPreferencesResponse(BaseModel):
    email: bool
    push: bool
    types: dict


class NotificationPreferencesUpdateRequest(BaseModel):
    email: Optional[bool] = None
    push: Optional[bool] = None
    types: Optional[dict] = None


class MessageResponse(BaseModel):
    message: str
    success: bool = True


# Helper Functions
def get_notification_preferences(user: User) -> dict:
    """Get notification preferences from user settings"""
    if not user.notification_settings:
        return {
            "email": True,
            "push": True,
            "types": {
                "application_status": True,
                "new_recommendations": True,
                "scraping_complete": True,
                "automation_updates": True,
                "interview_reminders": True,
                "system_updates": False
            }
        }
    return user.notification_settings


def save_notification_preferences(user: User, preferences: dict, db: Session):
    """Save notification preferences to user settings"""
    user.notification_settings = preferences
    db.commit()


# Routes
@router.get("", response_model=NotificationsListResponse)
async def get_notifications(
    unread: Optional[bool] = None,
    type: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get user notifications
    
    - Returns paginated list of notifications
    - Can filter by read status and type
    - Includes unread count
    """
    offset = (page - 1) * limit
    
    # Build query
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    
    if unread is not None:
        query = query.filter(Notification.read == (not unread))
    
    if type:
        query = query.filter(Notification.type == type)
    
    # Get total count
    total = query.count()
    
    # Get notifications
    notifications = query.order_by(desc(Notification.created_at)).offset(offset).limit(limit).all()
    
    # Get unread count
    unread_count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.read == False
    ).count()
    
    return NotificationsListResponse(
        notifications=[NotificationResponse.model_validate(n) for n in notifications],
        unread_count=unread_count,
        total=total
    )


@router.put("/{notification_id}/read", response_model=MessageResponse)
async def mark_as_read(
    notification_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Mark notification as read
    
    - Updates read status
    - Sets read timestamp
    """
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    notification.read = True
    notification.read_at = datetime.utcnow()
    db.commit()
    
    return MessageResponse(
        message="Notification marked as read",
        success=True
    )


@router.put("/read-all", response_model=MessageResponse)
async def mark_all_as_read(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Mark all notifications as read
    
    - Updates all unread notifications
    """
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.read == False
    ).update({
        "read": True,
        "read_at": datetime.utcnow()
    })
    db.commit()
    
    return MessageResponse(
        message="All notifications marked as read",
        success=True
    )


@router.delete("/{notification_id}", response_model=MessageResponse)
async def delete_notification(
    notification_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete a notification
    
    - Removes notification from database
    """
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    db.delete(notification)
    db.commit()
    
    return MessageResponse(
        message="Notification deleted",
        success=True
    )


@router.delete("/clear-all", response_model=MessageResponse)
async def clear_all_notifications(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Clear all notifications
    
    - Deletes all user notifications
    """
    db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).delete()
    db.commit()
    
    return MessageResponse(
        message="All notifications cleared",
        success=True
    )


@router.get("/preferences", response_model=NotificationPreferencesResponse)
async def get_preferences(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get notification preferences
    
    - Returns user's notification settings
    """
    preferences = get_notification_preferences(current_user)
    return NotificationPreferencesResponse(**preferences)


@router.put("/preferences", response_model=MessageResponse)
async def update_preferences(
    request: NotificationPreferencesUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update notification preferences
    
    - Updates email and push notification settings
    - Updates notification type preferences
    """
    preferences = get_notification_preferences(current_user)
    
    if request.email is not None:
        preferences["email"] = request.email
    
    if request.push is not None:
        preferences["push"] = request.push
    
    if request.types is not None:
        preferences["types"].update(request.types)
    
    save_notification_preferences(current_user, preferences, db)
    
    return MessageResponse(
        message="Notification preferences updated",
        success=True
    )


@router.get("/unread-count")
async def get_unread_count(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get unread notification count
    
    - Returns count of unread notifications
    """
    unread_count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.read == False
    ).count()
    
    return {"unread_count": unread_count}


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str,
    db: Session = Depends(get_db)
):
    """
    WebSocket endpoint for real-time notifications
    
    - Establishes WebSocket connection
    - Sends notifications in real-time
    - Handles connection lifecycle
    """
    # Validate token and get user
    try:
        from jose import jwt
        from config.settings import settings
        
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        user_id = int(payload.get("sub"))
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.can_login():
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
    except Exception as e:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    
    # Connect
    await manager.connect(user_id, websocket)
    
    try:
        # Send initial connection message
        await websocket.send_json({
            "type": "connection",
            "message": "Connected to notification service",
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Keep connection alive and listen for messages
        while True:
            data = await websocket.receive_text()
            # Handle any client messages if needed
            
    except WebSocketDisconnect:
        manager.disconnect(user_id)
    except Exception as e:
        manager.disconnect(user_id)


# Helper function to send notification via WebSocket
async def send_realtime_notification(user_id: int, notification: Notification):
    """
    Send notification via WebSocket to connected user
    
    - Called when new notification is created
    """
    notification_data = {
        "id": notification.id,
        "type": notification.type,
        "title": notification.title,
        "message": notification.message,
        "timestamp": notification.created_at.isoformat(),
        "action_url": notification.action_url,
        "action_label": notification.action_label,
        "metadata": notification.notification_metadata
    }
    
    await manager.send_notification(user_id, notification_data)


# Helper function to create notification
def create_notification(
    db: Session,
    user_id: int,
    type: str,
    title: str,
    message: str,
    action_url: Optional[str] = None,
    action_label: Optional[str] = None,
    metadata: Optional[dict] = None
) -> Notification:
    """
    Create a new notification
    
    - Saves to database
    - Sends via WebSocket if user is connected
    """
    notification = Notification(
        user_id=user_id,
        type=type,
        title=title,
        message=message,
        action_url=action_url,
        action_label=action_label,
        notification_metadata=metadata or {}
    )
    
    db.add(notification)
    db.commit()
    db.refresh(notification)
    
    # TODO: Send via WebSocket in background task
    # asyncio.create_task(send_realtime_notification(user_id, notification))
    
    return notification
