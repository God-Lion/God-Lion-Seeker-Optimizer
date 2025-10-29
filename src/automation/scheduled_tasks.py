"""
Scheduled Tasks Module
Defines and manages all scheduled automation tasks for the LinkedIn job scraper
Provides task definitions, execution wrappers, and task management utilities
"""
import asyncio
from typing import Dict, List, Optional, Callable, Any, Coroutine
from datetime import datetime, timedelta
from pathlib import Path
from enum import Enum
import json
from dataclasses import dataclass, field, asdict
import structlog

logger = structlog.get_logger(__name__)


class TaskStatus(str, Enum):
    """Task execution status"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"
    CANCELLED = "cancelled"


class TaskType(str, Enum):
    """Types of scheduled tasks"""
    SCRAPING = "scraping"
    MATCHING = "matching"
    EXPORT = "export"
    CLEANUP = "cleanup"
    NOTIFICATION = "notification"
    BACKUP = "backup"
    ANALYSIS = "analysis"
    HEALTH_CHECK = "health_check"


@dataclass
class TaskResult:
    """Result of task execution"""
    task_id: str
    task_type: TaskType
    status: TaskStatus
    started_at: datetime
    completed_at: Optional[datetime] = None
    duration_seconds: float = 0.0
    message: str = ""
    error: Optional[str] = None
    data: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'task_id': self.task_id,
            'task_type': self.task_type.value,
            'status': self.status.value,
            'started_at': self.started_at.isoformat(),
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'duration_seconds': self.duration_seconds,
            'message': self.message,
            'error': self.error,
            'data': self.data
        }


@dataclass
class ScheduledTask:
    """Definition of a scheduled task"""
    task_id: str
    task_type: TaskType
    name: str
    description: str
    func: Callable
    enabled: bool = True
    schedule: Optional[str] = None  # Cron expression or description
    timeout_seconds: int = 3600
    max_retries: int = 3
    retry_delay_seconds: int = 300
    dependencies: List[str] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
    last_run: Optional[datetime] = None
    last_status: TaskStatus = TaskStatus.PENDING
    execution_count: int = 0
    failure_count: int = 0
    metadata: Dict[str, Any] = field(default_factory=dict)


class TaskExecutor:
    """Executes scheduled tasks with error handling and retry logic"""
    
    def __init__(self, max_concurrent_tasks: int = 3):
        """
        Initialize task executor
        
        Args:
            max_concurrent_tasks: Maximum number of concurrent task executions
        """
        self.max_concurrent_tasks = max_concurrent_tasks
        self.running_tasks: Dict[str, asyncio.Task] = {}
        self.task_results: List[TaskResult] = []
        self.task_semaphore = asyncio.Semaphore(max_concurrent_tasks)
        
        logger.info(
            "task_executor_initialized",
            max_concurrent=max_concurrent_tasks
        )
    
    async def execute_task(
        self,
        task: ScheduledTask,
        retry_count: int = 0
    ) -> TaskResult:
        """
        Execute a single scheduled task with retry logic
        
        Args:
            task: Task to execute
            retry_count: Current retry attempt number
        
        Returns:
            TaskResult with execution details
        """
        async with self.task_semaphore:
            result = TaskResult(
                task_id=task.task_id,
                task_type=task.task_type,
                status=TaskStatus.RUNNING,
                started_at=datetime.now()
            )
            
            logger.info(
                "task_execution_started",
                task_id=task.task_id,
                task_type=task.task_type.value,
                retry_count=retry_count
            )
            
            try:
                # Add task to running tasks
                task_key = f"{task.task_id}_{retry_count}"
                running_task = asyncio.current_task()
                if running_task:
                    self.running_tasks[task_key] = running_task
                
                # Execute task with timeout
                if asyncio.iscoroutinefunction(task.func):
                    await asyncio.wait_for(
                        task.func(),
                        timeout=task.timeout_seconds
                    )
                else:
                    # Run sync function in thread pool
                    await asyncio.to_thread(
                        task.func
                    )
                
                # Success
                result.status = TaskStatus.COMPLETED
                result.completed_at = datetime.now()
                result.duration_seconds = (
                    result.completed_at - result.started_at
                ).total_seconds()
                result.message = f"Task completed successfully"
                
                # Update task tracking
                task.last_run = datetime.now()
                task.last_status = TaskStatus.COMPLETED
                task.execution_count += 1
                
                logger.info(
                    "task_execution_completed",
                    task_id=task.task_id,
                    duration_seconds=result.duration_seconds
                )
            
            except asyncio.TimeoutError:
                logger.error(
                    "task_execution_timeout",
                    task_id=task.task_id,
                    timeout_seconds=task.timeout_seconds
                )
                
                if retry_count < task.max_retries:
                    logger.info(
                        "task_retry_scheduled",
                        task_id=task.task_id,
                        retry_count=retry_count + 1
                    )
                    # Retry after delay
                    await asyncio.sleep(task.retry_delay_seconds)
                    return await self.execute_task(task, retry_count + 1)
                else:
                    result.status = TaskStatus.FAILED
                    result.error = f"Task timeout after {task.max_retries} retries"
                    task.failure_count += 1
            
            except Exception as e:
                logger.error(
                    "task_execution_failed",
                    task_id=task.task_id,
                    error=str(e),
                    exc_info=True
                )
                
                if retry_count < task.max_retries:
                    logger.info(
                        "task_retry_scheduled",
                        task_id=task.task_id,
                        retry_count=retry_count + 1,
                        error=str(e)
                    )
                    # Retry after delay
                    await asyncio.sleep(task.retry_delay_seconds)
                    return await self.execute_task(task, retry_count + 1)
                else:
                    result.status = TaskStatus.FAILED
                    result.error = f"Task failed: {str(e)}"
                    task.failure_count += 1
            
            finally:
                # Remove from running tasks
                task_key = f"{task.task_id}_{retry_count}"
                self.running_tasks.pop(task_key, None)
                
                # Store result
                self.task_results.append(result)
                if len(self.task_results) > 1000:
                    self.task_results.pop(0)
                
                # Update task status
                task.last_status = result.status
            
            return result
    
    async def execute_tasks_parallel(
        self,
        tasks: List[ScheduledTask]
    ) -> List[TaskResult]:
        """
        Execute multiple tasks in parallel (respecting semaphore limit)
        
        Args:
            tasks: Tasks to execute
        
        Returns:
            List of TaskResult objects
        """
        task_coros = [self.execute_task(task) for task in tasks]
        return await asyncio.gather(*task_coros, return_exceptions=False)
    
    async def execute_tasks_sequential(
        self,
        tasks: List[ScheduledTask]
    ) -> List[TaskResult]:
        """
        Execute tasks sequentially, respecting dependencies
        
        Args:
            tasks: Tasks to execute
        
        Returns:
            List of TaskResult objects
        """
        results = []
        task_dict = {task.task_id: task for task in tasks}
        
        for task in tasks:
            # Check dependencies
            if task.dependencies:
                for dep_id in task.dependencies:
                    if dep_id in task_dict:
                        dep_task = task_dict[dep_id]
                        if dep_task.last_status != TaskStatus.COMPLETED:
                            logger.warning(
                                "task_skipped_dependency_failed",
                                task_id=task.task_id,
                                failed_dependency=dep_id
                            )
                            result = TaskResult(
                                task_id=task.task_id,
                                task_type=task.task_type,
                                status=TaskStatus.SKIPPED,
                                started_at=datetime.now(),
                                completed_at=datetime.now(),
                                message=f"Dependency '{dep_id}' failed"
                            )
                            results.append(result)
                            continue
            
            # Execute task
            result = await self.execute_task(task)
            results.append(result)
        
        return results
    
    def get_running_tasks(self) -> Dict[str, str]:
        """Get currently running tasks"""
        return {
            task_id: str(task)
            for task_id, task in self.running_tasks.items()
        }
    
    def get_task_results(
        self,
        limit: int = 100,
        status: Optional[TaskStatus] = None,
        task_type: Optional[TaskType] = None
    ) -> List[TaskResult]:
        """
        Get task execution results with optional filtering
        
        Args:
            limit: Maximum number of results to return
            status: Filter by status
            task_type: Filter by task type
        
        Returns:
            List of TaskResult objects
        """
        results = self.task_results[-limit:]
        
        if status:
            results = [r for r in results if r.status == status]
        
        if task_type:
            results = [r for r in results if r.task_type == task_type]
        
        return results
    
    def get_execution_stats(self) -> Dict[str, Any]:
        """Get execution statistics"""
        completed = [r for r in self.task_results if r.status == TaskStatus.COMPLETED]
        failed = [r for r in self.task_results if r.status == TaskStatus.FAILED]
        
        avg_duration = 0.0
        if completed:
            avg_duration = sum(r.duration_seconds for r in completed) / len(completed)
        
        return {
            'total_executions': len(self.task_results),
            'completed': len(completed),
            'failed': len(failed),
            'success_rate': len(completed) / len(self.task_results) if self.task_results else 0,
            'avg_duration_seconds': avg_duration,
            'running_tasks': len(self.running_tasks)
        }


class TaskManager:
    """Manages task registration, scheduling, and execution"""
    
    def __init__(self, executor: Optional[TaskExecutor] = None):
        """
        Initialize task manager
        
        Args:
            executor: Custom TaskExecutor instance (creates default if None)
        """
        self.tasks: Dict[str, ScheduledTask] = {}
        self.executor = executor or TaskExecutor()
        self.task_history: List[TaskResult] = []
        
        logger.info("task_manager_initialized")
    
    def register_task(
        self,
        task_id: str,
        task_type: TaskType,
        name: str,
        description: str,
        func: Callable,
        enabled: bool = True,
        schedule: Optional[str] = None,
        timeout_seconds: int = 3600,
        max_retries: int = 3,
        dependencies: Optional[List[str]] = None,
        tags: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> ScheduledTask:
        """
        Register a new scheduled task
        
        Args:
            task_id: Unique task identifier
            task_type: Type of task
            name: Human-readable task name
            description: Task description
            func: Callable to execute
            enabled: Whether task is enabled
            schedule: Schedule string (cron or natural language)
            timeout_seconds: Execution timeout
            max_retries: Maximum retry attempts
            dependencies: List of task IDs this task depends on
            tags: Tags for organizing tasks
            metadata: Additional metadata
        
        Returns:
            Registered ScheduledTask
        """
        if task_id in self.tasks:
            logger.warning("task_already_registered", task_id=task_id)
        
        task = ScheduledTask(
            task_id=task_id,
            task_type=task_type,
            name=name,
            description=description,
            func=func,
            enabled=enabled,
            schedule=schedule,
            timeout_seconds=timeout_seconds,
            max_retries=max_retries,
            dependencies=dependencies or [],
            tags=tags or [],
            metadata=metadata or {}
        )
        
        self.tasks[task_id] = task
        
        logger.info(
            "task_registered",
            task_id=task_id,
            task_type=task_type.value,
            enabled=enabled
        )
        
        return task
    
    def unregister_task(self, task_id: str) -> bool:
        """Unregister a task"""
        if task_id in self.tasks:
            del self.tasks[task_id]
            logger.info("task_unregistered", task_id=task_id)
            return True
        
        logger.warning("task_not_found", task_id=task_id)
        return False
    
    def enable_task(self, task_id: str) -> bool:
        """Enable a task"""
        if task_id in self.tasks:
            self.tasks[task_id].enabled = True
            logger.info("task_enabled", task_id=task_id)
            return True
        return False
    
    def disable_task(self, task_id: str) -> bool:
        """Disable a task"""
        if task_id in self.tasks:
            self.tasks[task_id].enabled = False
            logger.info("task_disabled", task_id=task_id)
            return True
        return False
    
    def get_task(self, task_id: str) -> Optional[ScheduledTask]:
        """Get a registered task"""
        return self.tasks.get(task_id)
    
    def get_tasks(
        self,
        task_type: Optional[TaskType] = None,
        enabled_only: bool = False,
        tag: Optional[str] = None
    ) -> List[ScheduledTask]:
        """
        Get tasks with optional filtering
        
        Args:
            task_type: Filter by task type
            enabled_only: Only return enabled tasks
            tag: Filter by tag
        
        Returns:
            List of ScheduledTask objects
        """
        tasks = list(self.tasks.values())
        
        if enabled_only:
            tasks = [t for t in tasks if t.enabled]
        
        if task_type:
            tasks = [t for t in tasks if t.task_type == task_type]
        
        if tag:
            tasks = [t for t in tasks if tag in t.tags]
        
        return tasks
    
    async def execute_task(self, task_id: str) -> Optional[TaskResult]:
        """Execute a single task"""
        task = self.get_task(task_id)
        if not task:
            logger.error("task_not_found", task_id=task_id)
            return None
        
        if not task.enabled:
            logger.warning("task_disabled", task_id=task_id)
            result = TaskResult(
                task_id=task_id,
                task_type=task.task_type,
                status=TaskStatus.SKIPPED,
                started_at=datetime.now(),
                completed_at=datetime.now(),
                message="Task is disabled"
            )
            return result
        
        return await self.executor.execute_task(task)
    
    async def execute_tasks_by_type(self, task_type: TaskType) -> List[TaskResult]:
        """Execute all tasks of a specific type"""
        tasks = self.get_tasks(task_type=task_type, enabled_only=True)
        
        logger.info(
            "executing_tasks_by_type",
            task_type=task_type.value,
            count=len(tasks)
        )
        
        return await self.executor.execute_tasks_parallel(tasks)
    
    async def execute_all_tasks(self) -> List[TaskResult]:
        """Execute all enabled tasks"""
        tasks = self.get_tasks(enabled_only=True)
        
        logger.info("executing_all_tasks", count=len(tasks))
        
        return await self.executor.execute_tasks_parallel(tasks)
    
    def get_task_stats(self) -> Dict[str, Any]:
        """Get task statistics"""
        tasks = self.get_tasks()
        enabled_tasks = self.get_tasks(enabled_only=True)
        
        stats_by_type = {}
        for task_type in TaskType:
            type_tasks = self.get_tasks(task_type=task_type)
            stats_by_type[task_type.value] = len(type_tasks)
        
        return {
            'total_tasks': len(tasks),
            'enabled_tasks': len(enabled_tasks),
            'disabled_tasks': len(tasks) - len(enabled_tasks),
            'tasks_by_type': stats_by_type,
            'executor_stats': self.executor.get_execution_stats()
        }
    
    def export_tasks_to_json(self, filepath: str):
        """Export task definitions to JSON file"""
        tasks_data = []
        for task in self.get_tasks():
            task_dict = {
                'task_id': task.task_id,
                'task_type': task.task_type.value,
                'name': task.name,
                'description': task.description,
                'enabled': task.enabled,
                'schedule': task.schedule,
                'timeout_seconds': task.timeout_seconds,
                'max_retries': task.max_retries,
                'retry_delay_seconds': task.retry_delay_seconds,
                'dependencies': task.dependencies,
                'tags': task.tags,
                'created_at': task.created_at.isoformat(),
                'last_run': task.last_run.isoformat() if task.last_run else None,
                'last_status': task.last_status.value,
                'execution_count': task.execution_count,
                'failure_count': task.failure_count,
                'metadata': task.metadata
            }
            tasks_data.append(task_dict)
        
        path = Path(filepath)
        path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(path, 'w') as f:
            json.dump(tasks_data, f, indent=2)
        
        logger.info("tasks_exported", filepath=filepath, count=len(tasks_data))
    
    def get_execution_history(
        self,
        limit: int = 100,
        task_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get execution history"""
        results = self.executor.get_task_results(limit=limit)
        
        if task_id:
            results = [r for r in results if r.task_id == task_id]
        
        return [r.to_dict() for r in results]


# Built-in task definitions for common operations
class BuiltInTasks:
    """Factory for built-in scheduled tasks"""
    
    @staticmethod
    def create_scraping_task(
        scraper_func: Callable,
        task_id: str = "scrape_jobs",
        name: str = "Job Scraping",
        description: str = "Scrape job listings from LinkedIn"
    ) -> ScheduledTask:
        """Create a job scraping task"""
        return ScheduledTask(
            task_id=task_id,
            task_type=TaskType.SCRAPING,
            name=name,
            description=description,
            func=scraper_func,
            timeout_seconds=3600,
            tags=["scraping", "linkedin"]
        )
    
    @staticmethod
    def create_matching_task(
        matcher_func: Callable,
        task_id: str = "match_jobs",
        name: str = "Job Matching",
        description: str = "Match scraped jobs with resume"
    ) -> ScheduledTask:
        """Create a job matching task"""
        return ScheduledTask(
            task_id=task_id,
            task_type=TaskType.MATCHING,
            name=name,
            description=description,
            func=matcher_func,
            dependencies=["scrape_jobs"],
            timeout_seconds=1800,
            tags=["matching", "analysis"]
        )
    
    @staticmethod
    def create_export_task(
        export_func: Callable,
        task_id: str = "export_results",
        name: str = "Export Results",
        description: str = "Export job results to files"
    ) -> ScheduledTask:
        """Create a results export task"""
        return ScheduledTask(
            task_id=task_id,
            task_type=TaskType.EXPORT,
            name=name,
            description=description,
            func=export_func,
            dependencies=["match_jobs"],
            timeout_seconds=600,
            tags=["export", "output"]
        )
    
    @staticmethod
    def create_cleanup_task(
        cleanup_func: Callable,
        task_id: str = "cleanup_db",
        name: str = "Database Cleanup",
        description: str = "Clean up old records from database"
    ) -> ScheduledTask:
        """Create a cleanup task"""
        return ScheduledTask(
            task_id=task_id,
            task_type=TaskType.CLEANUP,
            name=name,
            description=description,
            func=cleanup_func,
            timeout_seconds=1800,
            tags=["maintenance", "database"]
        )
    
    @staticmethod
    def create_backup_task(
        backup_func: Callable,
        task_id: str = "backup_data",
        name: str = "Backup Data",
        description: str = "Backup database and important files"
    ) -> ScheduledTask:
        """Create a backup task"""
        return ScheduledTask(
            task_id=task_id,
            task_type=TaskType.BACKUP,
            name=name,
            description=description,
            func=backup_func,
            timeout_seconds=3600,
            tags=["backup", "maintenance"]
        )
    
    @staticmethod
    def create_health_check_task(
        health_check_func: Callable,
        task_id: str = "health_check",
        name: str = "System Health Check",
        description: str = "Check system health and report issues"
    ) -> ScheduledTask:
        """Create a health check task"""
        return ScheduledTask(
            task_id=task_id,
            task_type=TaskType.HEALTH_CHECK,
            name=name,
            description=description,
            func=health_check_func,
            timeout_seconds=300,
            tags=["monitoring", "health"]
        )


# Singleton instance
_task_manager_instance: Optional[TaskManager] = None


def get_task_manager(executor: Optional[TaskExecutor] = None) -> TaskManager:
    """Get or create TaskManager singleton"""
    global _task_manager_instance
    
    if _task_manager_instance is None:
        _task_manager_instance = TaskManager(executor=executor)
    
    return _task_manager_instance
