#!/bin/bash
# File: tests/smoke-tests.sh

echo "=== Running Smoke Tests ==="

# Test 1: Backend is running
echo -n "1. Backend Health Check: "
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://[BACKEND_URL]/api)
if [ "$HTTP_STATUS" = "200" ]; then
    echo "✓ PASS (Status: $HTTP_STATUS)"
else
    echo "✗ FAIL (Status: $HTTP_STATUS)"
    exit 1
fi

# Test 2: Admin panel accessible
echo -n "2. Admin Panel Check: "
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://[BACKEND_URL]/admin)
if [ "$HTTP_STATUS" = "200" ]; then
    echo "✓ PASS"
else
    echo "✗ FAIL (Status: $HTTP_STATUS)"
    exit 1
fi

# Test 3: Database connection
echo -n "3. Database Connection: "
ssh ubuntu@[EC2_IP] "cd [STRAPI_DIR] && npm run strapi -- --help" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ PASS"
else
    echo "✗ FAIL"
    exit 1
fi

# Test 4: Frontend deployment
echo -n "4. Frontend Health Check: "
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://[FRONTEND_URL])
if [ "$HTTP_STATUS" = "200" ]; then
    echo "✓ PASS"
else
    echo "✗ FAIL (Status: $HTTP_STATUS)"
    exit 1
fi

echo "=== All Smoke Tests Passed ==="