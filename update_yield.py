#!/usr/bin/env python3
"""
Script to update all yield patterns to yield* in the watch-selector codebase.
This ensures type safety by using yield* delegation instead of yield.
"""

import re
import os
import sys
from pathlib import Path
from typing import List, Tuple

def update_yield_patterns(content: str) -> Tuple[str, int]:
    """
    Update yield patterns to yield* in the given content.
    Returns the updated content and the number of replacements made.
    """
    # Pattern to match 'yield ' followed by a function call or identifier
    # but not if it's already 'yield*'
    pattern = r'yield\s+([a-zA-Z_$][\w$]*\s*\()'

    # Count replacements
    count = len(re.findall(pattern, content))

    # Replace 'yield function(' with 'yield* function('
    updated = re.sub(pattern, r'yield* \1', content)

    # Also handle 'yield variable' patterns (without parentheses)
    # But be careful not to match 'yield*' that's already there
    pattern2 = r'(?<![\*])\byield\s+([a-zA-Z_$][\w$]*(?:\s*[,;}\)]|$))'
    count += len(re.findall(pattern2, updated))
    updated = re.sub(pattern2, r'yield* \1', updated)

    return updated, count

def process_file(file_path: Path) -> bool:
    """
    Process a single file to update yield patterns.
    Returns True if changes were made, False otherwise.
    """
    try:
        content = file_path.read_text(encoding='utf-8')
        updated_content, count = update_yield_patterns(content)

        if count > 0:
            file_path.write_text(updated_content, encoding='utf-8')
            print(f"✅ Updated {file_path}: {count} replacements")
            return True
        else:
            print(f"⏭️  No changes needed in {file_path}")
            return False
    except Exception as e:
        print(f"❌ Error processing {file_path}: {e}")
        return False

def should_process_file(file_path: Path) -> bool:
    """
    Determine if a file should be processed based on its extension and location.
    """
    # Skip node_modules, dist, build directories
    parts = file_path.parts
    skip_dirs = {'node_modules', 'dist', 'build', '.git', 'coverage', '.vscode'}
    if any(part in skip_dirs for part in parts):
        return False

    # Process these file types
    extensions = {'.md', '.ts', '.tsx', '.js', '.jsx'}
    return file_path.suffix in extensions

def find_files_to_process(root_dir: Path) -> List[Path]:
    """
    Find all files that should be processed in the given directory.
    """
    files = []
    for file_path in root_dir.rglob('*'):
        if file_path.is_file() and should_process_file(file_path):
            files.append(file_path)
    return files

def main():
    """
    Main function to process all relevant files in the watch-selector project.
    """
    # Get the script's directory (should be in watch/ folder)
    script_dir = Path(__file__).parent

    print("🔄 Starting yield to yield* migration...")
    print(f"📁 Working directory: {script_dir}")

    # Find all files to process
    files = find_files_to_process(script_dir)
    print(f"📋 Found {len(files)} files to check")

    # Process each file
    updated_files = 0
    total_replacements = 0

    for file_path in files:
        relative_path = file_path.relative_to(script_dir)
        if process_file(file_path):
            updated_files += 1

    print("\n" + "="*50)
    print(f"✨ Migration complete!")
    print(f"📊 Updated {updated_files} out of {len(files)} files")

    # Special handling for specific files that need manual review
    print("\n⚠️  Files that may need manual review:")
    important_files = [
        'README.md',
        'CLAUDE.md',
        'src/api/events.ts',
        'src/api/dom-new.ts',
        'src/watch-enhanced.ts'
    ]

    for file_name in important_files:
        file_path = script_dir / file_name
        if file_path.exists():
            print(f"  - {file_name}")

    print("\n💡 Tip: Review the changes with 'git diff' before committing")

    return 0

if __name__ == "__main__":
    sys.exit(main())
