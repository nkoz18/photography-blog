# Strapi CMS Batch Upload Fix - Project Plan

## Phase 0: Context and Documentation Verification
**Goal**: Ensure Claude Code has all necessary context and access

### 0.1 Context Files Check
- [ ] Read `project-context.md` to understand current priorities
- [ ] Read `backend/BACKEND-CONTEXT.md` for backend technical details
- [ ] Read `frontend/FRONTEND-CONTEXT.md` for frontend deployment info
- [ ] Identify all [NEED VALUE] placeholders that need user input

### 0.2 Access Verification
- [ ] Verify SSH key exists and get the key name from user
- [ ] Get EC2 IP address from user
- [ ] Get Strapi directory path on EC2 from user
- [ ] Get process manager type (PM2 or systemd) from user
- [ ] Verify local development environment is set up

### 0.3 Documentation Access
- [ ] Confirm access to Strapi v4 documentation
- [ ] Confirm access to npm registry
- [ ] Review existing debugging information in project-context.md

---

## Phase 1: Backend Health Check
**Goal**: Verify backend deployment is working correctly

### 1.1 SSH to EC2 and Check Status
```bash
ssh -i ~/.ssh/[KEY_NAME] ec2-user@[EC2_IP]
cd [STRAPI_DIRECTORY]
```

### 1.2 Check Process Status
```bash
# If PM2
pm2 status
pm2 logs strapi-backend --lines 100

# If systemd
sudo systemctl status strapi
sudo journalctl -u strapi -n 100
```

### 1.3 Verify Strapi is Running
```bash
curl -I http://localhost:1337/admin
curl -I https://api.silkytruth.com/admin
```

### 1.4 Check Route Registration
```bash
# On EC2, check if batch upload route is registered
cd [STRAPI_DIRECTORY]
node -e "console.log(require('./src/api/article/routes/custom-article.js'))"
```

---

## Phase 2: Local Testing and Debugging
**Goal**: Reproduce and debug the issue locally

### 2.1 Set Up Local Environment
```bash
cd backend
npm install
cp .env.example .env  # Configure local env
```

### 2.2 Test Batch Upload Locally
- Start local Strapi: `npm run develop`
- Login to admin panel
- Test batch upload functionality
- Monitor console for errors

### 2.3 Debug Authentication Flow
- Add console logs to `src/api/article/controllers/article.js`
- Track JWT token through the request
- Verify middleware execution order

---

## Phase 3: Identify Root Cause
**Goal**: Determine exact cause of 401 error

### 3.1 Check Route Configuration
- Verify route is properly registered in Strapi
- Check middleware ordering
- Ensure authentication is applied correctly

### 3.2 Test with Direct API Calls
```bash
# Get auth token
TOKEN=$(curl -X POST https://api.silkytruth.com/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' \
  | jq -r '.data.token')

# Test batch upload
curl -X POST https://api.silkytruth.com/api/articles/1/batch-upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "files=@test.jpg"
```

### 3.3 Compare Working vs Non-Working Endpoints
- Compare regular upload endpoint with batch upload
- Check policy differences
- Review authentication middleware

---

## Phase 4: Implement Fix
**Goal**: Fix the 401 error

### 4.1 Potential Fixes (based on diagnosis)
1. **Route Registration Issue**
   - Update `src/api/article/routes/custom-article.js`
   - Ensure proper export format

2. **Middleware Issue**
   - Check middleware order in route config
   - Verify auth middleware is included

3. **Policy Issue**
   - Update policies in route configuration
   - Ensure admin privileges are properly checked

4. **Token Forwarding Issue**
   - Verify token is properly extracted from headers
   - Check if custom controller properly handles auth

### 4.2 Test Fix Locally
- Implement fix in local environment
- Thoroughly test batch upload
- Test edge cases (large files, multiple files)

---

## Phase 5: Deploy and Verify
**Goal**: Deploy fix to production

### 5.1 Deploy to EC2
```bash
# Commit changes (don't push)
git add .
git commit -m "Fix batch upload 401 authentication error"

# SSH to EC2
ssh -i ~/.ssh/[KEY_NAME] ec2-user@[EC2_IP]
cd [STRAPI_DIRECTORY]

# Deploy
git pull origin master
npm install
npm run build
[RESTART_COMMAND]  # pm2 restart or systemctl restart
```

### 5.2 Verify Fix in Production
- Test batch upload through admin panel
- Monitor logs for errors
- Test with various file sizes and counts

### 5.3 Update Documentation
- Update debugging steps in project-context.md
- Document the fix for future reference
- Update deployment guide if needed

---

## Phase 6: Post-Fix Tasks
**Goal**: Ensure long-term stability

### 6.1 Update Context Files
- Update `project-context.md` with solution
- Update `backend/BACKEND-CONTEXT.md` if architecture changed
- Remove [NEED VALUE] placeholders with actual values

### 6.2 Add Monitoring
- Set up error logging for batch uploads
- Add health check endpoint
- Configure alerts for 401 errors

### 6.3 Create Tests
- Add integration tests for batch upload
- Test authentication flow
- Add edge case tests

---

## Guidelines for Claude Code

### CRITICAL RULES:
1. **NO PLACEHOLDERS**: Never use placeholders like [VALUE] in actual commands. Always ask the user for specific values.
2. **CHECK CONTEXT FIRST**: Always read project-context.md before starting work
3. **UPDATE DOCUMENTATION**: Update context files whenever making architectural changes
4. **NO GIT PUSH**: Never run `git push`. Only stage and commit changes.
5. **TEST LOCALLY FIRST**: Always test fixes locally before deploying

### Command Templates
Replace these with actual values from the user:
- `[KEY_NAME]` → Ask: "What is your SSH key filename?"
- `[EC2_IP]` → Ask: "What is your EC2 instance IP?"
- `[STRAPI_DIRECTORY]` → Ask: "What is the Strapi directory path on EC2?"
- `[RESTART_COMMAND]` → Ask: "Do you use PM2 or systemd? What's the restart command?"

### Debugging Checklist
- [ ] Check logs (PM2/systemd)
- [ ] Verify route registration
- [ ] Test with curl
- [ ] Compare with working endpoints
- [ ] Check middleware order
- [ ] Verify authentication headers
- [ ] Test locally first

---

## Context File Templates

### project-context.md
```markdown
# Project Context - Photography Blog

## Current Priority Tasks
### 1. 🔴 CRITICAL: Fix Batch Upload 401 Error
**Status**: [In Progress/Completed]
**Solution**: [Document the fix here]

## System Information
- **EC2 IP**: [Actual IP]
- **SSH Key Path**: ~/.ssh/[Actual key name]
- **Strapi Directory**: /home/ec2-user/[Actual path]
- **Process Manager**: [PM2/systemd]
- **Restart Command**: [Actual command]

## Recent Changes Log
### [Date] - [Description]
- [What was changed]
- [Why it was changed]
- [Impact]
```

### backend-context.md
Update with:
- Any new routes added
- Authentication changes
- Middleware modifications
- Configuration updates

### frontend-context.md
Update if:
- API integration changes
- Build process modifications
- New environment variables

---

## Success Criteria
- [ ] Batch upload works in production
- [ ] No 401 errors in logs
- [ ] Can upload 10+ images at once
- [ ] Authentication properly handled
- [ ] Documentation updated
- [ ] Context files current