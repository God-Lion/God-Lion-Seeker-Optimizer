"""
CLI modules for God Lion Seeker Optimizer
"""

# Resume Customization CLI
try:
    from .resume_customization_cli import (
        customize_single_job,
        customize_batch,
        list_analyzed_jobs,
        main
    )
    __all__ = [
        'customize_single_job',
        'customize_batch', 
        'list_analyzed_jobs',
        'main'
    ]
except ImportError as e:
    print(f"Warning: Could not import resume customization CLI: {e}")
    __all__ = []

# Scraper CLI (if exists)
try:
    from .scraper_cli import *
except ImportError:
    pass

# Automation CLI
try:
    from .automation_cli import main as automation_main
except ImportError as e:
    print(f"Warning: Could not import automation CLI: {e}")
