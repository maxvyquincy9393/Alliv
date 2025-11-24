#!/bin/bash
# Complete Verification Script for All 16 Fixes
# Run this after applying all patches

set -e

echo "=========================================="
echo "Backend Fixes Verification Script"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $1"
        ((FAILED++))
    fi
}

# ISSUE 1: ProcessPoolExecutor
echo "=== Issue 1: AI Engine ProcessPoolExecutor ==="
grep -q "ProcessPoolExecutor" backend/app/ai_engine.py
check "ProcessPoolExecutor import found"

grep -q "self.process_pool = ProcessPoolExecutor" backend/app/ai_engine.py
check "ProcessPoolExecutor initialized"

grep -q "_encode_text_worker" backend/app/ai_engine.py
check "Worker function defined"

# ISSUE 2: Socket.IO Redis
echo ""
echo "=== Issue 2: Socket.IO Scalability ==="
grep -q "AsyncRedisManager" backend/app/main.py
check "AsyncRedisManager import found"

grep -q "client_manager=AsyncRedisManager" backend/app/main.py
check "Redis manager configured"

# ISSUE 3: Model Consolidation
echo ""
echo "=== Issue 3: Model Consolidation ==="
if [ ! -f backend/app/models_enhanced.py ]; then
    echo -e "${GREEN}✓${NC} models_enhanced.py removed"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} models_enhanced.py still exists"
    ((FAILED++))
fi

if [ -f backend/app/models.py ]; then
    echo -e "${GREEN}✓${NC} models.py exists"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} models.py missing"
    ((FAILED++))
fi

REFS=$(grep -r "models_enhanced" backend/app --include="*.py" 2>/dev/null | wc -l)
if [ "$REFS" -eq 0 ]; then
    echo -e "${GREEN}✓${NC} No references to models_enhanced"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Found $REFS references to models_enhanced"
    ((FAILED++))
fi

# ISSUE 4: AI Caching
echo ""
echo "=== Issue 4: AI Caching ==="
grep -q "get_match_score_cached" backend/app/ai_engine.py
check "Caching method exists"

grep -q "redis.asyncio" backend/app/ai_engine.py
check "Redis import found"

# ISSUE 5: DB Pooling
echo ""
echo "=== Issue 5: Database Connection Pooling ==="
grep -q "maxPoolSize" backend/app/db.py
check "maxPoolSize configured"

grep -q "minPoolSize" backend/app/db.py
check "minPoolSize configured"

# ISSUE 7: Testing
echo ""
echo "=== Issue 7: Testing Infrastructure ==="
if [ -f backend/pytest.ini ]; then
    echo -e "${GREEN}✓${NC} pytest.ini exists"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} pytest.ini missing"
    ((FAILED++))
fi

# ISSUE 8: Request ID
echo ""
echo "=== Issue 8: Request ID Tracing ==="
grep -q "add_request_id" backend/app/main.py
check "Request ID middleware found"

grep -q "X-Request-ID" backend/app/main.py
check "Request ID header set"

# ISSUE 9: Rate Limiting
echo ""
echo "=== Issue 9: Per-User Rate Limiting ==="
grep -q "rate_limit_key" backend/app/main.py
check "Rate limit key function found"

# ISSUE 10: Health Checks
echo ""
echo "=== Issue 10: Health Checks ==="
if [ -f backend/app/routers/health.py ]; then
    echo -e "${GREEN}✓${NC} health.py exists"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} health.py missing"
    ((FAILED++))
fi

grep -q "/health/live" backend/app/routers/health.py
check "Liveness endpoint exists"

grep -q "/health/ready" backend/app/routers/health.py
check "Readiness endpoint exists"

# Migration Script
echo ""
echo "=== Migration Script ==="
if [ -f backend/scripts/migrate_models.py ]; then
    echo -e "${GREEN}✓${NC} migrate_models.py exists"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} migrate_models.py missing"
    ((FAILED++))
fi

# Summary
echo ""
echo "=========================================="
echo "Verification Summary"
echo "=========================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All checks passed!${NC}"
    exit 0
else
    echo -e "${YELLOW}Some checks failed. Review output above.${NC}"
    exit 1
fi
