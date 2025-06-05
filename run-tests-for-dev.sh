#!/bin/bash
# File: run-tests-for-dev.sh
# Purpose: Simple test runner for development workflow
# Author: Nikita Kozlov <Nikita@Stroika.io>

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0

echo "==================================="
echo "   Development Test Runner"
echo "=================================="

# Function to run a test and track results
run_test() {
    local test_name=$1
    local test_command=$2
    
    echo -e "\n${YELLOW}Running: ${test_name}${NC}"
    if eval "$test_command"; then
        echo -e "${GREEN}✓ PASSED${NC}: ${test_name}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC}: ${test_name}"
        ((TESTS_FAILED++))
        # Don't exit, continue running other tests
    fi
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}ERROR: Not in project root directory${NC}"
    echo "Please run this from your Strapi project root"
    exit 1
fi

# Create test log directory
mkdir -p tests/logs
TEST_RUN_ID=$(date +%Y%m%d_%H%M%S)
LOG_FILE="tests/logs/test-run-${TEST_RUN_ID}.log"

echo "Logging to: $LOG_FILE"
echo "Test run started at: $(date)" > "$LOG_FILE"

# 1. Backend Health Check
run_test "Backend Health Check" "curl -s -o /dev/null -w '%{http_code}' https://[BACKEND_URL]/api | grep -q 200"

# 2. Admin Panel Check  
run_test "Admin Panel Accessibility" "curl -s -o /dev/null -w '%{http_code}' https://[BACKEND_URL]/admin | grep -q 200"

# 3. Frontend Check
run_test "Frontend Health Check" "curl -s -o /dev/null -w '%{http_code}' https://[FRONTEND_URL] | grep -q 200"

# 4. Git Repository Check
run_test "Git Repository Status" "git status --porcelain | wc -l | grep -q '^0' || echo 'Warning: Uncommitted changes'"

# 5. Node Modules Check
run_test "Node Modules Installed" "[ -d 'node_modules' ] && [ -f 'package-lock.json' ]"

# 6. Strapi Config Check
run_test "Strapi Configuration" "[ -f 'config/plugins.js' ] || [ -f 'config/plugins.ts' ]"

# 7. Upload Directory Check
run_test "Upload Directory Exists" "[ -d 'public/uploads' ]"

# 8. If upload tests exist, run them
if [ -f "tests/upload-tests.js" ]; then
    echo -e "\n${YELLOW}Running Upload Feature Tests...${NC}"
    cd tests
    if npm test > "../$LOG_FILE" 2>&1; then
        echo -e "${GREEN}✓ Upload tests passed${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ Upload tests failed${NC}"
        echo "Check $LOG_FILE for details"
        ((TESTS_FAILED++))
    fi
    cd ..
fi

# Summary
echo -e "\n==================================="
echo "         TEST SUMMARY"
echo "==================================="
echo -e "${GREEN}Passed: ${TESTS_PASSED}${NC}"
echo -e "${RED}Failed: ${TESTS_FAILED}${NC}"
echo "==================================="

# Update project context with test results
if [ -f "project-context.md" ]; then
    # Remove old test status and add new one
    sed -i '/^Last test run:/d' project-context.md 2>/dev/null || true
    echo "" >> project-context.md
    echo "Last test run: $(date) - ${TESTS_PASSED} passed, ${TESTS_FAILED} failed" >> project-context.md
fi

# Create a simple status file for development tracking
cat > tests/last-run-status.json << EOF
{
  "timestamp": "$(date -Iseconds)",
  "passed": ${TESTS_PASSED},
  "failed": ${TESTS_FAILED},
  "log_file": "${LOG_FILE}"
}
EOF

# Exit with appropriate code
if [ ${TESTS_FAILED} -gt 0 ]; then
    echo -e "\n${RED}⚠️  Some tests failed. Please check the logs.${NC}"
    exit 1
else
    echo -e "\n${GREEN}✅ All tests passed!${NC}"
    exit 0
fi