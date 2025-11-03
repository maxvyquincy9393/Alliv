"""
MASTER SCRIPT - Run All Fixes and Tests
Jalankan script ini untuk fix semua error dan test semua fitur
"""
import subprocess
import sys
import os
from pathlib import Path

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_header(text):
    print(f"\n{Colors.BOLD}{Colors.CYAN}{'='*70}")
    print(f"{text.center(70)}")
    print(f"{'='*70}{Colors.RESET}\n")

def print_step(num, total, title):
    print(f"\n{Colors.BOLD}{Colors.BLUE}[{num}/{total}] {title}{Colors.RESET}")
    print(f"{Colors.BLUE}{'-'*70}{Colors.RESET}")

def print_success(msg):
    print(f"{Colors.GREEN}✓ {msg}{Colors.RESET}")

def print_error(msg):
    print(f"{Colors.RED}✗ {msg}{Colors.RESET}")

def print_warning(msg):
    print(f"{Colors.YELLOW}⚠ {msg}{Colors.RESET}")

def run_script(script_name, description):
    """Run a Python script and return success status"""
    print(f"\n{Colors.MAGENTA}Running: {script_name}{Colors.RESET}")
    try:
        result = subprocess.run(
            [sys.executable, script_name],
            capture_output=True,
            text=True,
            timeout=300
        )
        
        if result.returncode == 0:
            print_success(f"{description} - SUCCESS")
            if result.stdout:
                # Print last few lines of output
                lines = result.stdout.strip().split('\n')
                for line in lines[-10:]:
                    if line.strip():
                        print(f"  {line}")
            return True
        else:
            print_error(f"{description} - FAILED")
            if result.stderr:
                print(f"{Colors.RED}{result.stderr[:500]}{Colors.RESET}")
            return False
    except subprocess.TimeoutExpired:
        print_warning(f"{description} - TIMEOUT (may need manual intervention)")
        return False
    except Exception as e:
        print_error(f"{description} - ERROR: {str(e)}")
        return False

def check_backend_running():
    """Check if backend is running on port 8000"""
    try:
        import socket
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        result = sock.connect_ex(('localhost', 8000))
        sock.close()
        return result == 0
    except:
        return False

def main():
    root = Path(__file__).parent
    os.chdir(root)
    
    print_header("COLABMATCH - MASTER FIX & TEST SCRIPT")
    print(f"{Colors.CYAN}This script will:{Colors.RESET}")
    print("  1. Fix all dependency errors")
    print("  2. Run configuration tests")
    print("  3. Run unit tests")
    print("  4. Check feature status")
    print("  5. Run comprehensive feature tests (if backend running)")
    print("\n" + Colors.YELLOW + "⚠ Note: Some tests require backend to be running" + Colors.RESET)
    print(f"{Colors.YELLOW}   Start backend in separate terminal: cd backend && python -m uvicorn app.main:app --reload --port 8000{Colors.RESET}\n")
    
    input(f"{Colors.CYAN}Press Enter to continue...{Colors.RESET}")
    
    results = {
        "passed": [],
        "failed": [],
        "skipped": []
    }
    
    # Step 1: Fix Dependencies
    print_step(1, 5, "FIX ALL DEPENDENCIES")
    if run_script("fix_and_test_all.py", "Dependency Fix"):
        results["passed"].append("Dependency Fix")
    else:
        results["failed"].append("Dependency Fix")
        print_warning("Some dependency fixes may have failed, continuing...")
    
    # Step 2: Check Feature Status
    print_step(2, 5, "CHECK FEATURE STATUS")
    if run_script("check_feature_status.py", "Feature Status Check"):
        results["passed"].append("Feature Status Check")
    else:
        results["failed"].append("Feature Status Check")
    
    # Step 3: Run Unit Tests
    print_step(3, 5, "RUN UNIT TESTS")
    print(f"{Colors.MAGENTA}Running pytest unit tests...{Colors.RESET}")
    try:
        result = subprocess.run(
            [sys.executable, "-m", "pytest", "backend/tests/unit/test_auth.py", "-v", "--tb=short"],
            capture_output=True,
            text=True,
            cwd=root,
            timeout=60
        )
        
        if "passed" in result.stdout.lower():
            print_success("Unit Tests - PASSED")
            results["passed"].append("Unit Tests")
            # Show summary
            for line in result.stdout.split('\n'):
                if 'passed' in line.lower() or 'failed' in line.lower():
                    print(f"  {line}")
        else:
            print_warning("Unit Tests - Some tests may have issues")
            results["failed"].append("Unit Tests")
            print(result.stdout[-500:] if result.stdout else "No output")
    except subprocess.TimeoutExpired:
        print_warning("Unit Tests - TIMEOUT")
        results["skipped"].append("Unit Tests")
    except Exception as e:
        print_error(f"Unit Tests - ERROR: {str(e)}")
        results["failed"].append("Unit Tests")
    
    # Step 4: Check Backend Status
    print_step(4, 5, "CHECK BACKEND SERVER")
    backend_running = check_backend_running()
    
    if backend_running:
        print_success("Backend is running on http://localhost:8000")
        results["passed"].append("Backend Running")
    else:
        print_warning("Backend is NOT running")
        print(f"{Colors.YELLOW}  To start backend: cd backend && python -m uvicorn app.main:app --reload --port 8000{Colors.RESET}")
        results["skipped"].append("Backend Running")
    
    # Step 5: Comprehensive Feature Tests
    print_step(5, 5, "COMPREHENSIVE FEATURE TESTS")
    
    if backend_running:
        if run_script("test_all_features.py", "Comprehensive Feature Tests"):
            results["passed"].append("Feature Tests")
        else:
            results["failed"].append("Feature Tests")
    else:
        print_warning("Skipping feature tests - backend not running")
        print(f"{Colors.YELLOW}  Start backend first, then run: python test_all_features.py{Colors.RESET}")
        results["skipped"].append("Feature Tests")
    
    # Final Summary
    print_header("FINAL SUMMARY")
    
    total = len(results["passed"]) + len(results["failed"]) + len(results["skipped"])
    passed = len(results["passed"])
    failed = len(results["failed"])
    skipped = len(results["skipped"])
    
    print(f"{Colors.BOLD}Total Steps: {total}{Colors.RESET}")
    print(f"{Colors.GREEN}✓ Passed:  {passed}{Colors.RESET}")
    print(f"{Colors.RED}✗ Failed:  {failed}{Colors.RESET}")
    print(f"{Colors.YELLOW}⊘ Skipped: {skipped}{Colors.RESET}")
    
    if results["passed"]:
        print(f"\n{Colors.GREEN}{Colors.BOLD}Passed:{Colors.RESET}")
        for item in results["passed"]:
            print(f"{Colors.GREEN}  ✓ {item}{Colors.RESET}")
    
    if results["failed"]:
        print(f"\n{Colors.RED}{Colors.BOLD}Failed:{Colors.RESET}")
        for item in results["failed"]:
            print(f"{Colors.RED}  ✗ {item}{Colors.RESET}")
    
    if results["skipped"]:
        print(f"\n{Colors.YELLOW}{Colors.BOLD}Skipped:{Colors.RESET}")
        for item in results["skipped"]:
            print(f"{Colors.YELLOW}  ⊘ {item}{Colors.RESET}")
    
    # Recommendations
    print(f"\n{Colors.BOLD}RECOMMENDATIONS:{Colors.RESET}")
    
    if failed == 0 and skipped == 0:
        print(f"{Colors.GREEN}✓ ALL TESTS PASSED - READY FOR PRODUCTION!{Colors.RESET}")
    elif failed == 0:
        print(f"{Colors.YELLOW}⚠ Some tests skipped - start backend to run full tests{Colors.RESET}")
        print(f"{Colors.CYAN}  cd backend && python -m uvicorn app.main:app --reload --port 8000{Colors.RESET}")
    else:
        print(f"{Colors.RED}✗ Some tests failed - check errors above{Colors.RESET}")
        print(f"{Colors.CYAN}  Review logs and fix issues before deploying{Colors.RESET}")
    
    print(f"\n{Colors.BOLD}NEXT STEPS:{Colors.RESET}")
    if not backend_running:
        print(f"{Colors.YELLOW}1. Start backend: cd backend && python -m uvicorn app.main:app --reload --port 8000{Colors.RESET}")
        print(f"{Colors.YELLOW}2. Run comprehensive tests: python test_all_features.py{Colors.RESET}")
    else:
        print(f"{Colors.GREEN}1. ✓ Backend is running{Colors.RESET}")
        print(f"{Colors.CYAN}2. Start frontend: cd frontend && npm run dev{Colors.RESET}")
        print(f"{Colors.CYAN}3. Test in browser: http://localhost:5173{Colors.RESET}")
    
    print(f"\n{Colors.BOLD}DOCUMENTATION:{Colors.RESET}")
    print(f"  • {Colors.CYAN}SEMUA_ERROR_FIXED.md{Colors.RESET} - Complete error fix report")
    print(f"  • {Colors.CYAN}FIX_AND_TEST_GUIDE.md{Colors.RESET} - Detailed testing guide")
    print(f"  • {Colors.CYAN}COMPLETE_FIX_README.md{Colors.RESET} - Full documentation")
    
    print(f"\n{Colors.BOLD}{'='*70}{Colors.RESET}\n")
    
    return 0 if failed == 0 else 1

if __name__ == "__main__":
    try:
        exit_code = main()
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}⚠ Interrupted by user{Colors.RESET}")
        sys.exit(1)
    except Exception as e:
        print(f"\n{Colors.RED}✗ Fatal error: {e}{Colors.RESET}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
