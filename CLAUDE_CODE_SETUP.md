# Development Environment Setup Guide

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

## Git Sync Workflow

### Before Starting Work
```bash
# Always pull latest changes first
git pull origin master

# Check if EC2 is out of sync
ssh -i ~/.ssh/ec2-strapi-key-pair.pem ubuntu@44.246.84.130 "cd /home/ubuntu/photography-blog && git status"
```

### After Making Changes
```bash
# Stage and commit changes
git add .
git commit -m "Description of changes"
git push origin master

# Update EC2 with latest changes
ssh -i ~/.ssh/ec2-strapi-key-pair.pem ubuntu@44.246.84.130 "cd /home/ubuntu/photography-blog && git pull origin master && cd backend && pm2 restart photography-blog"
```

### Emergency Sync Commands
```bash
# If local and remote are out of sync
git fetch origin
git reset --hard origin/master

# If EC2 is out of sync
ssh -i ~/.ssh/ec2-strapi-key-pair.pem ubuntu@44.246.84.130 "cd /home/ubuntu/photography-blog && git fetch origin && git reset --hard origin/master && cd backend && pm2 restart photography-blog"
```

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

### Deploy Single File
```bash
# Copy specific file to EC2
scp -i ~/.ssh/ec2-strapi-key-pair.pem /local/path/file.js ubuntu@44.246.84.130:/home/ubuntu/photography-blog/backend/path/file.js

# Restart backend
ssh -i ~/.ssh/ec2-strapi-key-pair.pem ubuntu@44.246.84.130 "cd /home/ubuntu/photography-blog/backend && pm2 restart photography-blog"
```

### View Logs
```bash
# Real-time logs
ssh -i ~/.ssh/ec2-strapi-key-pair.pem ubuntu@44.246.84.130 "pm2 logs photography-blog --lines 50"

# Error logs only
ssh -i ~/.ssh/ec2-strapi-key-pair.pem ubuntu@44.246.84.130 "pm2 logs photography-blog --err --lines 20"
```

### Health Check
```bash
# Check backend status
curl -I https://api.silkytruth.com/api/articles

# Check PM2 status
ssh -i ~/.ssh/ec2-strapi-key-pair.pem ubuntu@44.246.84.130 "pm2 status"

# Check disk space
ssh -i ~/.ssh/ec2-strapi-key-pair.pem ubuntu@44.246.84.130 "df -h"
```

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