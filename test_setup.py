"""
Quick Setup Test Script for CollabMatch
Tests if all dependencies are available
"""
import sys
import subprocess

def test_python():
    """Test Python version"""
    print("✓ Python version:", sys.version.split()[0])
    return True

def test_package(package_name):
    """Test if a Python package is installed"""
    try:
        __import__(package_name)
        print(f"✓ {package_name} is installed")
        return True
    except ImportError:
        print(f"✗ {package_name} is NOT installed")
        return False

def test_command(command):
    """Test if a command is available"""
    try:
        result = subprocess.run(
            command, 
            shell=True, 
            capture_output=True, 
            text=True,
            timeout=5
        )
        if result.returncode == 0 or "version" in result.stdout.lower():
            print(f"✓ {command.split()[0]} is available")
            return True
        else:
            print(f"✗ {command.split()[0]} is NOT available")
            return False
    except Exception as e:
        print(f"✗ {command.split()[0]} is NOT available")
        return False

def main():
    print("=" * 60)
    print("CollabMatch Setup Test")
    print("=" * 60)
    print()
    
    # Test Python
    print("1. Python Environment")
    print("-" * 40)
    test_python()
    print()
    
    # Test Python packages
    print("2. Python Packages (Backend)")
    print("-" * 40)
    packages = ['fastapi', 'uvicorn', 'motor', 'pydantic', 'jose', 'passlib']
    backend_ok = all(test_package(pkg) for pkg in packages)
    print()
    
    # Test Docker
    print("3. Docker")
    print("-" * 40)
    docker_ok = test_command("docker --version")
    print()
    
    # Test MongoDB
    print("4. MongoDB")
    print("-" * 40)
    mongo_ok = test_command("mongosh --version") or test_command("mongo --version")
    print()
    
    # Test Flutter
    print("5. Flutter")
    print("-" * 40)
    flutter_ok = test_command("flutter --version")
    print()
    
    # Summary
    print("=" * 60)
    print("Summary")
    print("=" * 60)
    
    if not backend_ok:
        print("\n⚠️  Backend dependencies missing!")
        print("   Install with: pip install -r backend/requirements.txt")
    
    if not docker_ok:
        print("\n⚠️  Docker not found!")
        print("   Install Docker Desktop from: https://www.docker.com/products/docker-desktop")
    
    if not mongo_ok and not docker_ok:
        print("\n⚠️  MongoDB not found!")
        print("   Option 1: Use Docker (recommended)")
        print("   Option 2: Install MongoDB from: https://www.mongodb.com/try/download/community")
    
    if not flutter_ok:
        print("\n⚠️  Flutter not found!")
        print("   Install from: https://flutter.dev/docs/get-started/install")
    
    if backend_ok and (docker_ok or mongo_ok):
        print("\n✅ Backend can be tested!")
        print("   Run: cd backend && uvicorn app.main:app --reload")
    
    if flutter_ok:
        print("\n✅ Frontend can be tested!")
        print("   Run: cd frontend && flutter run")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    main()
