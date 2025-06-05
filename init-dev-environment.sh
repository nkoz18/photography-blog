#!/bin/bash
# Initialization script for Claude Code
# Author: Nikita Kozlov

echo "=== Claude Code Initialization ==="
echo "Checking project context files..."

# Check for required context files
for file in project-context.md backend/BACKEND-CONTEXT.md frontend/FRONTEND-CONTEXT.md; do
    if [ -f "$file" ]; then
        echo "✓ Found: $file"
    else
        echo "✗ Missing: $file"
    fi
done

# Display current priorities
if [ -f "project-context.md" ]; then
    echo -e "\n=== Current Priorities ==="
    grep -A 5 "^### 1\." project-context.md
fi

# Check SSH key
echo -e "\n=== SSH Configuration ==="
if [ -f ~/.ssh/id_rsa ] || [ -f ~/.ssh/id_ed25519 ]; then
    echo "✓ SSH key found"
else
    echo "✗ No SSH key found"
fi

echo -e "\n=== Next Steps ==="
echo "1. Review project-context.md for current priorities"
echo "2. Fill in any [NEED VALUE] placeholders"
echo "3. Run health checks from Phase 1 of the project plan"