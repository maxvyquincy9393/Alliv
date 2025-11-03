#!/usr/bin/env python
"""
Test runner script with coverage
"""
import sys
import subprocess

def main():
    """Run tests with coverage"""
    print("🧪 Running tests with coverage...")
    print("=" * 60)
    
    # Run pytest with coverage
    result = subprocess.run([
        sys.executable, "-m", "pytest",
        "-v",
        "--cov=app",
        "--cov-report=term-missing",
        "--cov-report=html",
        "--cov-fail-under=70"
    ])
    
    if result.returncode == 0:
        print("\n" + "=" * 60)
        print("✅ All tests passed!")
        print("📊 Coverage report: htmlcov/index.html")
        print("=" * 60)
    else:
        print("\n" + "=" * 60)
        print("❌ Tests failed!")
        print("=" * 60)
        sys.exit(1)

if __name__ == "__main__":
    main()
