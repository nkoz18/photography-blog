# Testing Strategy Summary for Development

## What We've Built

### 1. Main Test Runner
**File**: `./run-tests-for-dev.sh`
- Health checks for backend, frontend, database
- Runs all tests in sequence
- Logs results to `tests/logs/`
- Updates `project-context.md` with results
- Creates `tests/last-run-status.json` for status checking

### 2. Upload-Specific Tests
**File**: `tests/upload-tests.js`
- **CRITICAL**: Reproduces the 401 batch upload error
- Tests single upload, batch upload, large files
- Uses real authentication flow
- Clearly shows which scenarios fail

### 3. Quick Health Checks
**File**: `tests/smoke-tests.sh`
- Fast tests to verify system is functional
- Can be run before making any changes

### 4. Test Data Setup
**File**: `tests/setup-test-data.sh`
- Creates test images for upload testing
- Works with or without ImageMagick

## How Development Workflow Should Use This

### 1. First Thing - Establish Baseline
```bash
# Run this BEFORE making any changes
./run-tests-for-dev.sh
```

### 2. Reproduce the 401 Error
```bash
# This should show "✗ Batch upload failed: 401"
cd tests && node upload-tests.js
```

### 3. After Making Changes
```bash
# Run the same tests - they should improve
./run-tests-for-dev.sh
cd tests && node upload-tests.js  # Should show "✓ Batch upload successful"
```

### 4. Configuration Requirements
Development tools must ask for these values to replace placeholders:
- `[BACKEND_URL]` → Backend URL (https://api.silkytruth.com)
- `[FRONTEND_URL]` → Frontend URL  
- `[TEST_EMAIL]` → Test user email
- `[TEST_PASSWORD]` → Test user password
- `[EC2_IP]` → EC2 instance IP

## Key Benefits

1. **Consistent Reproduction**: Upload tests will always reproduce the 401 error
2. **Safety Net**: Can't accidentally break something without knowing
3. **Progress Tracking**: See exactly when the fix works
4. **Debugging Aid**: Detailed logs help identify root cause
5. **Documentation**: Test results are automatically logged

## Success Criteria

When the batch upload is fixed, these should all pass:
- ✅ All health checks in main test runner
- ✅ Upload tests show "✓ Batch upload successful"
- ✅ No 401 errors in test logs
- ✅ All existing functionality still works

## Files Development Tools Must Update

When configuring tests, development tools should edit:
1. `run-tests-for-dev.sh` - Replace URL placeholders
2. `tests/upload-tests.js` - Replace URL and auth placeholders  
3. `tests/smoke-tests.sh` - Replace URL and SSH placeholders

**Remember**: NO placeholders in final commands - always ask user for real values!

---

**Developer**: Nikita Kozlov <Nikita@Stroika.io>  
**Project**: Photography Blog Testing Strategy