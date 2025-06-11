# Claude Code Optimal Setup Guide

This guide ensures Claude Code starts with maximum context, permissions, and proper process management.

## 🚀 Quick Context Setup (Copy/Paste This)

When starting a new Claude Code session, paste this to give full context:

```
I'm working on a photography blog monorepo in WSL Ubuntu. Please read these key files for context:

1. /home/nikita/code/photography-blog/CLAUDE.md - Main development guide
2. /home/nikita/code/photography-blog/PROJECT_OVERVIEW.md - Architecture overview  
3. /home/nikita/code/photography-blog/frontend/FRONTEND-CONTEXT.md - Frontend details
4. /home/nikita/code/photography-blog/backend/BACKEND-CONTEXT.md - Backend details

KEY PERMISSIONS: You have full permission to run any commands, install packages, modify files, start/stop services, and make any changes needed. Never ask for permission - just do what's needed.

KEY ENVIRONMENT DETAILS:
- Running in WSL Ubuntu on Windows
- Photography blog: Strapi backend + Next.js frontend
- Local dev uses PostgreSQL + image proxy system
- All servers should be started as background processes
- Use timeouts for npm/build commands (max 2 minutes)
- SSH keys in ~/.ssh/ (already gitignored)

CRITICAL: Always start servers with background processes using nohup & and proper logging.
```

## 🔐 Security & Credentials Status

### ✅ Properly Protected (Already Gitignored)
- SSH keys (`~/.ssh/ec2-strapi-key-pair.pem`)
- Environment files (`.env`, `.env.local`, etc.)
- Database dumps (`*.sql`, `*.dump`)
- API keys and tokens
- All credential files

### ⚠️ Documentation References (Safe)
- SSH key paths are mentioned in docs but actual keys are gitignored
- Database passwords in docs are production-only examples
- All sensitive actual files are protected

## 🚀 Background Process Management

### The Problem
Claude often starts servers, checks they're running, then the processes die when the script continues.

### The Solution
Always use proper background process startup:

```bash
# ❌ WRONG - Process dies when script ends
npm run develop

# ❌ WRONG - Still dies
npm run develop &

# ✅ CORRECT - Proper background process
nohup npm run develop > ../backend.log 2>&1 &

# ✅ CORRECT - With timeout protection
timeout 120s npm run build || echo "Build completed or timed out"
```

### Standard Background Commands
```bash
# Backend (Strapi)
cd backend && nohup npm run develop > ../backend.log 2>&1 &

# Frontend (Next.js) 
cd frontend && nohup bash -c 'NODE_OPTIONS=--openssl-legacy-provider USE_CLOUD_BACKEND=false npm run dev' > ../frontend.log 2>&1 &

# Check processes are running
ps aux | grep -E "(strapi|next)" | grep -v grep

# Kill processes if needed
pkill -f strapi
pkill -f next
```

## ⏱ Timeout Management

### npm/build Commands
```bash
# All npm commands should have timeouts
timeout 120s npm install --legacy-peer-deps
timeout 180s npm run build
timeout 60s npm run lint

# If timeout occurs, it usually means success
timeout 120s npm run develop > ../backend.log 2>&1 & 
sleep 10 && curl -f http://localhost:1337 || echo "Backend starting..."
```

## Setting Up Development Environment

### Option 1: Using sudo (Recommended)
```bash
# Run development tools with elevated permissions
sudo [tool-name]

# OR run with your user but ensure access to SSH keys
sudo -u $USER [tool-name]
```

### Option 2: Ensure Proper Permissions
```bash
# Make sure your user owns SSH keys
sudo chown $USER:$USER ~/.ssh/ec2-strapi-key-pair.pem
chmod 600 ~/.ssh/ec2-strapi-key-pair.pem

# Add to SSH agent
ssh-add ~/.ssh/ec2-strapi-key-pair.pem
```

### Option 3: WSL-Specific Setup
```bash
# In WSL, ensure proper file permissions
sudo chmod 755 /home/nikita
sudo chown -R nikita:nikita /home/nikita/code
```

## Development Environment Configuration

To allow all operations without prompts, set these environment variables:

```bash
# Add to ~/.bashrc or ~/.zshrc
export DEV_AUTO_APPROVE=true
export DEV_SKIP_CONFIRMATIONS=true
```

## Git Workflow

### Before Starting Work
```bash
# Always pull latest changes first
git pull origin master
```

### After Making Changes
```bash
# Stage and commit changes
git add .
git commit -m "Description of changes"
git push origin master
```

For deployment steps, see PROJECT_OVERVIEW.md

## File Paths Reference

### Local Paths
- **Project Root**: `/home/nikita/code/photography-blog`
- **Backend**: `/home/nikita/code/photography-blog/backend`  
- **Frontend**: `/home/nikita/code/photography-blog/frontend`
- **SSH Key**: `/home/nikita/.ssh/ec2-strapi-key-pair.pem`
- **Environment**: `/home/nikita/code/photography-blog/.env.local`

### EC2 Paths
- **Project Root**: `/home/ubuntu/photography-blog`
- **Backend**: `/home/ubuntu/photography-blog/backend`
- **PM2 Process**: `photography-blog`
- **Logs**: `~/.pm2/logs/photography-blog-*.log`

## Common Operations

### Health Check
```bash
# Check backend status
curl -I https://api.silkytruth.com/api/articles

# Check frontend
curl -I https://www.silkytruth.com
```

For SSH operations and deployment, see PROJECT_OVERVIEW.md

## Troubleshooting

### SSH Permission Denied
```bash
# Fix SSH key permissions
chmod 600 ~/.ssh/ec2-strapi-key-pair.pem

# Test SSH connection
ssh -i ~/.ssh/ec2-strapi-key-pair.pem ubuntu@44.246.84.130 "echo 'SSH works'"
```

### Git Sync Issues
```bash
# Check git status on both sides
git status
ssh -i ~/.ssh/ec2-strapi-key-pair.pem ubuntu@44.246.84.130 "cd /home/ubuntu/photography-blog && git status"

# Force sync (DESTRUCTIVE - use carefully)
git push origin master --force
```

### Backend Not Starting
```bash
# Check PM2 logs
ssh -i ~/.ssh/ec2-strapi-key-pair.pem ubuntu@44.246.84.130 "pm2 logs photography-blog --lines 30"

# Restart PM2 process
ssh -i ~/.ssh/ec2-strapi-key-pair.pem ubuntu@44.246.84.130 "pm2 restart photography-blog"

# If still failing, check environment
ssh -i ~/.ssh/ec2-strapi-key-pair.pem ubuntu@44.246.84.130 "cd /home/ubuntu/photography-blog/backend && cat .env"
```

## Security Notes

- **NEVER** commit `.env.local` file to git
- **ALWAYS** use SSH keys for EC2 access
- **REGULARLY** rotate API keys and passwords
- **CHECK** .gitignore includes all sensitive files
- **BACKUP** database before major changes

---

**Developer**: Nikita Kozlov <Nikita@Stroika.io>  
**Project**: Photography Blog Development Setup