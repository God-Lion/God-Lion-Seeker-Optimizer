"""
Pytest configuration for src directory tests.
Ensures all src modules are importable.
"""
import sys
from pathlib import Path

# Add parent directory (project root) to path so 'src' package is importable
project_root = Path(__file__).parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

# Add src directory itself for direct imports
src_path = Path(__file__).parent
if str(src_path) not in sys.path:
    sys.path.insert(0, str(src_path))
