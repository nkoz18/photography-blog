# Development Quick Start Guide

## First Time Setup
1. Run: `./init-dev-environment.sh`
2. Read: `project-context.md` - Check the top priority task
3. Read: `strapi-cms-project-plan.md` - Follow Phase 0 first

## Important Files
- `project-context.md` - Current priorities and system info
- `backend/BACKEND-CONTEXT.md` - Backend technical details  
- `frontend/FRONTEND-CONTEXT.md` - Frontend deployment info
- `strapi-cms-project-plan.md` - Detailed implementation plan

## Critical Rules
1. NEVER use placeholders - ask for specific values
2. NEVER run `git push` - only provide the command
3. ALWAYS update context files when making changes
4. CHECK project-context.md before starting any work

## Missing Information Needed
Check project-context.md for [NEED VALUE] items:
- EC2 IP address
- SSH Key name
- Strapi directory path on EC2
- Process manager type (PM2 or systemd)
- Node version on EC2
- GitHub repository URL

## Current Priority
🔴 CRITICAL: Fix Batch Upload 401 Unauthorized Error
- After backend deployment to EC2
- Batch upload returns 401 error
- Individual uploads work fine
- See debugging steps in project-context.md

## Testing Requirements

### ALWAYS RUN TESTS BEFORE AND AFTER CHANGES
```bash
# 1. Establish baseline before any changes
./run-tests-for-dev.sh

# 2. Reproduce the 401 error specifically
cd tests && node upload-tests.js
# This will show: "✗ Batch upload failed: 401"

# 3. After making fixes, run tests again
./run-tests-for-dev.sh
# Goal: All tests pass, especially upload tests
```

### Critical Testing Rules
1. **NEVER commit code that breaks existing tests**
2. **ALWAYS test your changes immediately**
3. **The upload test MUST reproduce the 401 error first**
4. **Success = upload test shows "✓ Batch upload successful"**
5. **Check tests/logs/ for detailed error information**

### Test Configuration Needed
Ask user for these values to replace in test files:
- Backend URL (likely: https://api.silkytruth.com)
- Frontend URL
- Test user email and password for Strapi
- EC2 IP address

---

**Developer**: Nikita Kozlov <Nikita@Stroika.io>  
**Project**: Photography Blog Development Quick Start