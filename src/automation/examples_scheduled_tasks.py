"""
Example usage and integration tests for the scheduled tasks module
Demonstrates common patterns and workflows
"""
import asyncio
from datetime import datetime, timedelta
from src.automation import (
    TaskManager,
    TaskExecutor,
    TaskType,
    TaskStatus,
    BuiltInTasks,
    get_task_manager
)


# ============================================================================
# Example 1: Basic Task Registration and Execution
# ============================================================================

async def example_basic_tasks():
    """Example: Register and execute basic tasks"""
    print("\n" + "="*70)
    print("Example 1: Basic Task Registration and Execution")
    print("="*70)
    
    manager = TaskManager()
    
    # Define simple task functions
    async def task_a():
        await asyncio.sleep(1)
        print("Task A completed")
    
    def task_b():
        """Synchronous task"""
        print("Task B completed")
    
    # Register tasks
    manager.register_task(
        task_id="task_a",
        task_type=TaskType.SCRAPING,
        name="Task A",
        description="First example task",
        func=task_a
    )
    
    manager.register_task(
        task_id="task_b",
        task_type=TaskType.ANALYSIS,
        name="Task B",
        description="Second example task",
        func=task_b
    )
    
    # Execute tasks
    print("\nExecuting tasks...")
    result_a = await manager.execute_task("task_a")
    result_b = await manager.execute_task("task_b")
    
    print(f"\nTask A Result:")
    print(f"  Status: {result_a.status.value}")
    print(f"  Duration: {result_a.duration_seconds:.2f}s")
    
    print(f"\nTask B Result:")
    print(f"  Status: {result_b.status.value}")
    print(f"  Duration: {result_b.duration_seconds:.2f}s")


# ============================================================================
# Example 2: Task Dependencies and Sequential Execution
# ============================================================================

async def example_dependencies():
    """Example: Task dependencies and sequential execution"""
    print("\n" + "="*70)
    print("Example 2: Task Dependencies and Sequential Execution")
    print("="*70)
    
    manager = TaskManager()
    
    # Define tasks with dependencies
    async def scrape_data():
        await asyncio.sleep(1)
        print("✓ Data scraped")
    
    async def process_data():
        await asyncio.sleep(1)
        print("✓ Data processed")
    
    async def generate_report():
        await asyncio.sleep(1)
        print("✓ Report generated")
    
    # Register with dependencies
    manager.register_task(
        task_id="scrape",
        task_type=TaskType.SCRAPING,
        name="Scrape Data",
        description="Scrape raw data",
        func=scrape_data
    )
    
    manager.register_task(
        task_id="process",
        task_type=TaskType.ANALYSIS,
        name="Process Data",
        description="Process scraped data",
        func=process_data,
        dependencies=["scrape"]
    )
    
    manager.register_task(
        task_id="report",
        task_type=TaskType.EXPORT,
        name="Generate Report",
        description="Generate final report",
        func=generate_report,
        dependencies=["process"]
    )
    
    # Execute sequentially
    print("\nExecuting tasks sequentially with dependency checking...")
    tasks = manager.get_tasks(enabled_only=True)
    results = await manager.executor.execute_tasks_sequential(tasks)
    
    print(f"\nExecution Summary:")
    for result in results:
        print(f"  {result.task_id}: {result.status.value}")


# ============================================================================
# Example 3: Error Handling and Retries
# ============================================================================

async def example_retries():
    """Example: Error handling and automatic retries"""
    print("\n" + "="*70)
    print("Example 3: Error Handling and Automatic Retries")
    print("="*70)
    
    manager = TaskManager()
    
    attempt_count = 0
    
    async def flaky_task():
        """Task that fails first 2 times, then succeeds"""
        nonlocal attempt_count
        attempt_count += 1
        print(f"  Attempt {attempt_count}...", end=" ")
        
        if attempt_count < 3:
            raise Exception(f"Simulated failure (attempt {attempt_count})")
        
        print("Success!")
    
    # Register with retry configuration
    manager.register_task(
        task_id="flaky",
        task_type=TaskType.ANALYSIS,
        name="Flaky Task",
        description="Task that may fail",
        func=flaky_task,
        max_retries=3,
        retry_delay_seconds=1
    )
    
    print("\nExecuting flaky task with automatic retries...")
    result = await manager.execute_task("flaky")
    
    print(f"\nFinal Result:")
    print(f"  Status: {result.status.value}")
    print(f"  Total Attempts: {attempt_count}")
    print(f"  Duration: {result.duration_seconds:.2f}s")
    if result.error:
        print(f"  Error: {result.error}")


# ============================================================================
# Example 4: Parallel Task Execution
# ============================================================================

async def example_parallel():
    """Example: Parallel task execution"""
    print("\n" + "="*70)
    print("Example 4: Parallel Task Execution")
    print("="*70)
    
    manager = TaskManager()
    
    # Define multiple independent tasks
    async def task_worker(task_num: int, duration: float):
        print(f"    Worker {task_num} starting...")
        await asyncio.sleep(duration)
        print(f"    Worker {task_num} done")
    
    # Register tasks
    for i in range(5):
        manager.register_task(
            task_id=f"worker_{i}",
            task_type=TaskType.SCRAPING,
            name=f"Worker {i}",
            description=f"Parallel worker {i}",
            func=lambda n=i: task_worker(n, 2)
        )
    
    print("\nExecuting 5 tasks in parallel (with max 3 concurrent)...")
    import time
    start_time = time.time()
    
    results = await manager.execute_tasks_by_type(TaskType.SCRAPING)
    
    elapsed = time.time() - start_time
    
    print(f"\nExecution Summary:")
    print(f"  Total Time: {elapsed:.2f}s")
    print(f"  Results: {len(results)}")
    print(f"  Success Rate: {sum(1 for r in results if r.status == TaskStatus.COMPLETED) / len(results) * 100:.1f}%")


# ============================================================================
# Example 5: Built-in Task Factories
# ============================================================================

async def example_builtin_tasks():
    """Example: Using built-in task factories"""
    print("\n" + "="*70)
    print("Example 5: Built-in Task Factories")
    print("="*70)
    
    manager = TaskManager()
    
    # Define implementation functions
    async def my_scraper():
        print("Scraping jobs...")
        await asyncio.sleep(0.5)
    
    async def my_matcher():
        print("Matching jobs...")
        await asyncio.sleep(0.5)
    
    async def my_exporter():
        print("Exporting results...")
        await asyncio.sleep(0.5)
    
    async def my_cleanup():
        print("Cleaning up...")
        await asyncio.sleep(0.5)
    
    async def my_health_check():
        print("Checking health...")
        await asyncio.sleep(0.3)
    
    # Create tasks using factories
    scrape_task = BuiltInTasks.create_scraping_task(my_scraper)
    match_task = BuiltInTasks.create_matching_task(my_matcher)
    export_task = BuiltInTasks.create_export_task(my_exporter)
    cleanup_task = BuiltInTasks.create_cleanup_task(my_cleanup)
    health_task = BuiltInTasks.create_health_check_task(my_health_check)
    
    # Register all tasks
    for task in [scrape_task, match_task, export_task, cleanup_task, health_task]:
        manager.register_task(
            task_id=task.task_id,
            task_type=task.task_type,
            name=task.name,
            description=task.description,
            func=task.func,
            dependencies=task.dependencies
        )
    
    print("\nBuilt-in tasks registered:")
    for task in manager.get_tasks():
        print(f"  • {task.name}")
    
    # Execute pipeline
    print("\nExecuting task pipeline...")
    tasks = manager.get_tasks(enabled_only=True)
    results = await manager.executor.execute_tasks_sequential(tasks)
    
    print(f"\nPipeline Results:")
    for result in results:
        print(f"  {result.task_id}: {result.status.value}")


# ============================================================================
# Example 6: Task Filtering and Management
# ============================================================================

async def example_filtering():
    """Example: Task filtering and management operations"""
    print("\n" + "="*70)
    print("Example 6: Task Filtering and Management")
    print("="*70)
    
    manager = TaskManager()
    
    # Register various tasks
    async def dummy_task():
        await asyncio.sleep(0.1)
    
    for i in range(10):
        task_type = [TaskType.SCRAPING, TaskType.ANALYSIS, TaskType.EXPORT][i % 3]
        tags = ["production"] if i % 2 == 0 else ["testing"]
        
        manager.register_task(
            task_id=f"task_{i}",
            task_type=task_type,
            name=f"Task {i}",
            description=f"Example task {i}",
            func=dummy_task,
            tags=tags
        )
    
    # Filter tasks
    print("\nTask Filtering:")
    
    scraping_tasks = manager.get_tasks(task_type=TaskType.SCRAPING)
    print(f"  Scraping tasks: {len(scraping_tasks)}")
    
    prod_tasks = manager.get_tasks(tag="production")
    print(f"  Production tasks: {len(prod_tasks)}")
    
    # Disable some tasks
    for task in manager.get_tasks(tag="testing"):
        manager.disable_task(task.task_id)
    
    enabled_tasks = manager.get_tasks(enabled_only=True)
    print(f"  Enabled tasks: {len(enabled_tasks)}")
    
    # Get statistics
    print("\nTask Statistics:")
    stats = manager.get_task_stats()
    for key, value in stats.items():
        if key != "executor_stats":
            print(f"  {key}: {value}")


# ============================================================================
# Example 7: Execution History and Metrics
# ============================================================================

async def example_metrics():
    """Example: Tracking execution history and metrics"""
    print("\n" + "="*70)
    print("Example 7: Execution History and Metrics")
    print("="*70)
    
    manager = TaskManager()
    
    # Register and execute some tasks multiple times
    async def sample_task():
        await asyncio.sleep(0.2)
    
    manager.register_task(
        task_id="sample",
        task_type=TaskType.ANALYSIS,
        name="Sample Task",
        description="Sample task for metrics",
        func=sample_task
    )
    
    # Execute multiple times
    print("\nExecuting task 5 times...")
    for i in range(5):
        await manager.execute_task("sample")
        print(f"  Execution {i+1} completed")
    
    # Get statistics
    stats = manager.executor.get_execution_stats()
    
    print("\nExecution Statistics:")
    print(f"  Total Executions: {stats['total_executions']}")
    print(f"  Completed: {stats['completed']}")
    print(f"  Failed: {stats['failed']}")
    print(f"  Success Rate: {stats['success_rate'] * 100:.1f}%")
    print(f"  Avg Duration: {stats['avg_duration_seconds']:.3f}s")
    
    # Get history
    history = manager.get_execution_history(limit=10)
    print(f"\nExecution History ({len(history)} entries):")
    for entry in history:
        print(f"  {entry['task_id']}: {entry['status']} ({entry['duration_seconds']:.3f}s)")


# ============================================================================
# Example 8: Task Tagging and Organization
# ============================================================================

async def example_tagging():
    """Example: Using tags for task organization"""
    print("\n" + "="*70)
    print("Example 8: Task Tagging and Organization")
    print("="*70)
    
    manager = TaskManager()
    
    async def dummy():
        await asyncio.sleep(0.1)
    
    # Register tasks with various tags
    task_configs = [
        ("daily_scrape", ["scraping", "daily", "production"]),
        ("hourly_update", ["scraping", "hourly", "production"]),
        ("weekly_report", ["analysis", "weekly", "production"]),
        ("test_scrape", ["scraping", "testing"]),
        ("dev_analysis", ["analysis", "development"]),
    ]
    
    for task_id, tags in task_configs:
        manager.register_task(
            task_id=task_id,
            task_type=TaskType.SCRAPING if "scraping" in tags else TaskType.ANALYSIS,
            name=task_id.replace("_", " ").title(),
            description=f"Task with tags: {', '.join(tags)}",
            func=dummy,
            tags=tags
        )
    
    print("\nTasks organized by tags:")
    
    for tag in ["production", "testing", "development", "daily", "hourly"]:
        tagged_tasks = manager.get_tasks(tag=tag)
        if tagged_tasks:
            print(f"\n  [{tag}] - {len(tagged_tasks)} tasks")
            for task in tagged_tasks:
                print(f"    • {task.name}")


# ============================================================================
# Main Runner
# ============================================================================

async def main():
    """Run all examples"""
    try:
        await example_basic_tasks()
        await example_dependencies()
        await example_retries()
        await example_parallel()
        await example_builtin_tasks()
        await example_filtering()
        await example_metrics()
        await example_tagging()
        
        print("\n" + "="*70)
        print("All examples completed successfully!")
        print("="*70)
        
    except Exception as e:
        print(f"\nError running examples: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
