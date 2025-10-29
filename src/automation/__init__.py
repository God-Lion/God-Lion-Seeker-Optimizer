"""Automation module for scheduled job scraping and analysis"""
from .automation_service import AutomationService
from .automation_dashboard import AutomationDashboard
from .automation_config import AutomationConfig
from .scheduled_tasks import (
    TaskManager,
    TaskExecutor,
    ScheduledTask,
    TaskResult,
    TaskStatus,
    TaskType,
    BuiltInTasks,
    get_task_manager
)
from .scheduler import JobScheduler, get_scheduler

__all__ = [
    'AutomationService',
    'AutomationDashboard',
    'AutomationConfig',
    'TaskManager',
    'TaskExecutor',
    'ScheduledTask',
    'TaskResult',
    'TaskStatus',
    'TaskType',
    'BuiltInTasks',
    'get_task_manager',
    'JobScheduler',
    'get_scheduler'
]
