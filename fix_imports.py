#!/usr/bin/env python3
"""
Fix relative imports to absolute imports in the src directory.
This script converts imports like 'from config.database import ...' 
to 'from src.config.database import ...'
"""

import os
import re
from pathlib import Path

# Modules that need to be prefixed with 'src.'
MODULES_TO_FIX = [
    'api', 'config', 'models', 'services', 'repositories', 
    'scrapers', 'utils', 'automation', 'notifications', 'auth', 'cli'
]

def fix_imports_in_file(file_path: Path) -> bool:
    """Fix imports in a single file. Returns True if changes were made."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Fix 'from module import ...' patterns
        for module in MODULES_TO_FIX:
            # Match: from module.something import ...
            # Don't match if already has src. prefix
            pattern = rf'^from {module}\.'
            replacement = f'from src.{module}.'
            content = re.sub(pattern, replacement, content, flags=re.MULTILINE)
        
        # Fix 'import module' patterns (less common but possible)
        for module in MODULES_TO_FIX:
            # Match: import module or import module.something
            # Don't match if already has src. prefix
            pattern = rf'^import {module}($|\.)'
            replacement = f'import src.{module}\\1'
            content = re.sub(pattern, replacement, content, flags=re.MULTILINE)
        
        # Fix standalone 'from models import' pattern (special case)
        # This handles cases like 'from models import Base'
        pattern = r'^from models import'
        replacement = 'from src.models import'
        content = re.sub(pattern, replacement, content, flags=re.MULTILINE)
        
        # Fix standalone 'from module import' and 'import module' patterns
        # This catches cases like 'from auth import ...' or 'import auth'
        for module in MODULES_TO_FIX:
            # Match: from module import (without a dot after module)
            pattern = rf'^from {module} import'
            replacement = f'from src.{module} import'
            content = re.sub(pattern, replacement, content, flags=re.MULTILINE)
            
            # Match: import module (standalone, not module.something)
            pattern = rf'^import {module}$'
            replacement = f'import src.{module}'
            content = re.sub(pattern, replacement, content, flags=re.MULTILINE)
        
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        
        return False
    
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False

def main():
    """Main function to fix all imports in src directory."""
    src_dir = Path(__file__).parent / 'src'
    
    if not src_dir.exists():
        print(f"Error: {src_dir} does not exist")
        return
    
    print(f"Scanning {src_dir} for Python files...")
    
    files_changed = 0
    files_scanned = 0
    
    # Walk through all Python files in src directory
    for py_file in src_dir.rglob('*.py'):
        files_scanned += 1
        if fix_imports_in_file(py_file):
            files_changed += 1
            print(f"Fixed: {py_file.relative_to(src_dir)}")
    
    print(f"\nSummary:")
    print(f"  Files scanned: {files_scanned}")
    print(f"  Files changed: {files_changed}")
    print(f"  Files unchanged: {files_scanned - files_changed}")

if __name__ == '__main__':
    main()
