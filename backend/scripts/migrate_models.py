#!/usr/bin/env python3
"""
Migration script to safely rename models_enhanced.py to models.py
"""
import os
import shutil
from datetime import datetime
from pathlib import Path
import subprocess


def main():
    print("=" * 60)
    print("Models Migration Script")
    print("=" * 60)
    
    # Paths
    app_dir = Path(__file__).parent.parent / "app"
    models_enhanced = app_dir / "models_enhanced.py"
    models_old = app_dir / "models.py"
    
    # Step 1: Check files exist
    print("\n[1/5] Checking file existence...")
    
    if not models_enhanced.exists():
        print("✗ models_enhanced.py not found - checking if migration already done...")
        if models_old.exists():
            print("✓ models.py exists - migration may already be complete")
            return 0
        else:
            print("✗ ERROR: Neither models_enhanced.py nor models.py found!")
            return 1
    print(f"✓ Found models_enhanced.py")
    
    # Step 2: Backup old models.py if it exists
    if models_old.exists():
        print("\n[2/5] Backing up old models.py...")
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = app_dir / f"models.py.bak.{timestamp}"
        shutil.copy2(models_old, backup_path)
        print(f"✓ Backed up to: {backup_path}")
        
        # Delete old models.py
        models_old.unlink()
        print("✓ Deleted old models.py")
    else:
        print("\n[2/5] No old models.py found, skipping backup")
    
    # Step 3: Rename models_enhanced.py to models.py
    print("\n[3/5] Renaming models_enhanced.py to models.py...")
    shutil.move(str(models_enhanced), str(models_old))
    print("✓ Renamed successfully")
    
    # Step 4: Find leftover references
    print("\n[4/5] Searching for leftover references...")
    try:
        result = subprocess.run(
            ["grep", "-r", "-n", "models_enhanced", str(app_dir), "--include=*.py"],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print("✗ WARNING: Found references to models_enhanced:")
            print(result.stdout)
            print("\nPlease update these imports manually:")
            print("  from ..models_enhanced import X  →  from ..models import X")
        else:
            print("✓ No references to models_enhanced found")
    except FileNotFoundError:
        print("⚠ grep not available, skipping reference check")
    
    # Step 5: Verification
    print("\n[5/5] Verification...")
    if models_old.exists():
        print("✓ models.py exists")
    else:
        print("✗ ERROR: models.py not found after migration!")
        return 1
    
    if not models_enhanced.exists():
        print("✓ models_enhanced.py removed")
    else:
        print("✗ WARNING: models_enhanced.py still exists!")
    
    print("\n" + "=" * 60)
    print("Migration completed!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Run: grep -r 'models_enhanced' backend/app --include='*.py'")
    print("2. Update any remaining imports")
    print("3. Run tests: pytest tests/")
    print("4. Delete backup file after verification")
    
    return 0


if __name__ == "__main__":
    exit(main())
