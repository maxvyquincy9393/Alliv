#!/bin/bash
# ==============================================================================
# Security Check Script
# ==============================================================================
# Runs security audits and checks for common security issues
# ==============================================================================

set -e

echo "🔒 COLABMATCH Security Audit"
echo "============================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ISSUES_FOUND=0

print_header() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "$1"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
}

# 1. Check for committed secrets
print_header "1. Checking for committed secrets..."

if [ -f ".env" ]; then
    print_error ".env file found in repository root!"
    echo "   Remove with: git rm --cached .env"
fi

if [ -f "backend/.env" ]; then
    print_error "backend/.env file found in repository!"
    echo "   Remove with: git rm --cached backend/.env"
fi

if [ -f "frontend/.env" ]; then
    print_error "frontend/.env file found in repository!"
    echo "   Remove with: git rm --cached frontend/.env"
fi

# Check git history for secrets
if git log --all --full-history --source -- "*/.env" "*/.env.local" "*/secrets/*" >/dev/null 2>&1; then
    print_warning "Found .env files in git history"
    echo "   Consider cleaning git history if secrets were committed"
else
    print_success "No .env files found in git history"
fi

# 2. Check Node.js dependencies
print_header "2. Checking Node.js dependencies..."

cd frontend
if [ -f "package.json" ]; then
    echo "Running npm audit..."
    if npm audit --audit-level=moderate; then
        print_success "No vulnerable dependencies found in frontend"
    else
        print_error "Vulnerable dependencies found in frontend"
        echo "   Run: npm audit fix"
    fi
else
    print_warning "package.json not found"
fi
cd ..

# 3. Check Python dependencies
print_header "3. Checking Python dependencies..."

cd backend
if [ -f "requirements.txt" ]; then
    # Check if pip-audit is installed
    if command -v pip-audit >/dev/null 2>&1; then
        echo "Running pip-audit..."
        if pip-audit; then
            print_success "No vulnerable dependencies found in backend"
        else
            print_error "Vulnerable dependencies found in backend"
            echo "   Review and update vulnerable packages"
        fi
    else
        print_warning "pip-audit not installed"
        echo "   Install with: pip install pip-audit"
    fi
else
    print_warning "requirements.txt not found"
fi
cd ..

# 4. Check .env.example exists
print_header "4. Checking environment templates..."

if [ -f "env.example" ]; then
    print_success "env.example exists"
else
    print_error "env.example not found"
fi

if [ -f "frontend/env.example" ]; then
    print_success "frontend/env.example exists"
else
    print_error "frontend/env.example not found"
fi

# 5. Check for hardcoded secrets in code
print_header "5. Scanning for hardcoded secrets..."

# Common patterns for secrets
PATTERNS=(
    "password.*=.*['\"][^'\"]{8,}"
    "api[_-]?key.*=.*['\"][^'\"]{20,}"
    "secret.*=.*['\"][^'\"]{20,}"
    "token.*=.*['\"][^'\"]{20,}"
    "private[_-]?key"
    "BEGIN.*PRIVATE.*KEY"
)

FOUND_SECRETS=false
for pattern in "${PATTERNS[@]}"; do
    if git grep -iE "$pattern" -- '*.py' '*.ts' '*.tsx' '*.js' '*.jsx' ':!node_modules' ':!.venv' ':!dist' 2>/dev/null; then
        FOUND_SECRETS=true
    fi
done

if [ "$FOUND_SECRETS" = true ]; then
    print_error "Potential hardcoded secrets found!"
    echo "   Review the matches above"
else
    print_success "No obvious hardcoded secrets found"
fi

# 6. Check CORS configuration
print_header "6. Checking CORS configuration..."

if grep -q "CORS_ORIGIN.*\*" backend/.env 2>/dev/null; then
    print_error "CORS is set to '*' (allow all origins)"
    echo "   Set specific origin in production"
elif grep -q "CORS_ORIGIN" backend/.env 2>/dev/null; then
    print_success "CORS origin is configured"
else
    print_warning "CORS_ORIGIN not found in .env"
fi

# 7. Check Docker security
print_header "7. Checking Docker security..."

# Check if running as root
if grep -q "USER root" backend/Dockerfile frontend/Dockerfile 2>/dev/null; then
    print_error "Container running as root user"
else
    print_success "Containers using non-root user"
fi

# 8. Check for debug mode in production
print_header "8. Checking for debug configurations..."

if grep -q "NODE_ENV.*development" backend/.env 2>/dev/null; then
    print_warning "Backend NODE_ENV is set to development"
    echo "   Set to 'production' for production deployments"
fi

if grep -q "DEBUG.*True" backend/.env 2>/dev/null; then
    print_error "DEBUG mode is enabled"
    echo "   Disable in production"
fi

# Summary
print_header "Security Audit Summary"

if [ $ISSUES_FOUND -eq 0 ]; then
    print_success "No critical issues found! ✨"
    echo ""
    echo "Your application follows basic security best practices."
    echo ""
    echo "Additional recommendations:"
    echo "  • Keep dependencies updated regularly"
    echo "  • Use strong, unique secrets in production"
    echo "  • Enable HTTPS/SSL in production"
    echo "  • Configure rate limiting"
    echo "  • Enable monitoring and logging"
    exit 0
else
    print_error "Found $ISSUES_FOUND security issue(s)"
    echo ""
    echo "Please address the issues above before deploying to production."
    echo ""
    echo "For more information, see SECURITY.md"
    exit 1
fi






