# Claude Code Quick Setup

## 🎯 COPY/PASTE THIS FOR ANY NEW CLAUDE CODE SESSION

```
PHOTOGRAPHY BLOG DEV SETUP:

Read all project documentation for complete context:
- /home/nikita/code/photography-blog/CLAUDE.md (Main development guide with all commands)
- /home/nikita/code/photography-blog/PROJECT_OVERVIEW.md (Architecture & deployment)
- /home/nikita/code/photography-blog/DOCUMENTATION_INDEX.md (Full documentation map)
- /home/nikita/code/photography-blog/TESTING_STRATEGY_SUMMARY.md (Testing infrastructure)
- /home/nikita/code/photography-blog/frontend/FRONTEND-CONTEXT.md (Frontend details)
- /home/nikita/code/photography-blog/backend/BACKEND-CONTEXT.md (Backend details)

KEY PERMISSIONS: You have full permission to run any commands, install packages, modify files, start/stop services, and make any changes needed. Never ask for permission - just do what's needed.

ENVIRONMENT: WSL Ubuntu, Photography blog monorepo (Strapi v4.2.0 + Next.js v11), PostgreSQL local dev, AWS production

TECH STACK DOCUMENTATION: I have Context7 MCP server installed providing real-time access to documentation for all libraries we use:
- Next.js v11 (static generation + client-side fetching)
- Strapi v4.2.0 (headless CMS)
- React 17 (frontend framework)
- PostgreSQL (database)
- Framer Motion v6.5.1 (animations)
- PhotoSwipe v5.4.4 (galleries)
- React Markdown v4.2.2 (content rendering)
- AWS Amplify (frontend hosting)

Use Context7 tools (mcp__context7__resolve-library-id, mcp__context7__get-library-docs) to access up-to-date documentation for any of these libraries when needed.

START DEVELOPMENT SERVERS IMMEDIATELY IF NEEDED:
1. Check if servers running: curl -s http://localhost:1337 > /dev/null && echo "Backend ✓" || echo "Backend ✗"; curl -s http://localhost:3000 > /dev/null && echo "Frontend ✓" || echo "Frontend ✗"
2. Start backend if needed: cd /home/nikita/code/photography-blog/backend && nohup npm run develop > ../logs/backend-postgres.log 2>&1 & sleep 5
3. Start frontend if needed: cd /home/nikita/code/photography-blog/frontend && nohup bash -c 'NODE_OPTIONS=--openssl-legacy-provider USE_CLOUD_BACKEND=false npm run dev' > ../logs/frontend-local.log 2>&1 & sleep 5
4. Verify: ps aux | grep -E "(strapi|next)" | grep -v grep

DATABASE SYNC: Use backend/database-sync/ scripts to sync production data locally when needed
TESTING: Use ./run-tests-for-dev.sh for comprehensive testing workflow
DEPLOYMENT: git push origin master triggers AWS Amplify (frontend), manual EC2 deployment for backend
```

**That's it!** This single command gives Claude Code complete project context, permissions, environment details, library documentation access, and all essential workflows.