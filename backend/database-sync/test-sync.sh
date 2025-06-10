#!/bin/bash

# Quick test to demonstrate database sync
# This will just show what the database sync would do without actually running it

echo "🧪 Testing database sync process..."
echo ""

# Check current local state
echo "📊 Current local database state:"
CURRENT_ARTICLES=$(PGPASSWORD='localpass' psql -h localhost -U strapi -d postgres -t -c "SELECT COUNT(*) FROM articles;" 2>/dev/null | tr -d ' ')
CURRENT_WRITERS=$(PGPASSWORD='localpass' psql -h localhost -U strapi -d postgres -t -c "SELECT COUNT(*) FROM writers;" 2>/dev/null | tr -d ' ')
CURRENT_FILES=$(PGPASSWORD='localpass' psql -h localhost -U strapi -d postgres -t -c "SELECT COUNT(*) FROM files;" 2>/dev/null | tr -d ' ')

echo "   Articles: $CURRENT_ARTICLES"
echo "   Writers: $CURRENT_WRITERS"  
echo "   Files: $CURRENT_FILES"
echo ""

# Check production state via SSH
echo "📊 Production database state:"
PROD_ARTICLES=$(ssh -i ~/.ssh/ec2-strapi-key-pair.pem ubuntu@44.246.84.130 "PGPASSWORD='TmiY7bdr22WCB7N' psql -h photography-blog-db.ckmckf7lbra5.us-west-2.rds.amazonaws.com -p 5432 -U postgres -d strapi -t -c 'SELECT COUNT(*) FROM articles;'" 2>/dev/null | tr -d ' ')
PROD_WRITERS=$(ssh -i ~/.ssh/ec2-strapi-key-pair.pem ubuntu@44.246.84.130 "PGPASSWORD='TmiY7bdr22WCB7N' psql -h photography-blog-db.ckmckf7lbra5.us-west-2.rds.amazonaws.com -p 5432 -U postgres -d strapi -t -c 'SELECT COUNT(*) FROM writers;'" 2>/dev/null | tr -d ' ')
PROD_FILES=$(ssh -i ~/.ssh/ec2-strapi-key-pair.pem ubuntu@44.246.84.130 "PGPASSWORD='TmiY7bdr22WCB7N' psql -h photography-blog-db.ckmckf7lbra5.us-west-2.rds.amazonaws.com -p 5432 -U postgres -d strapi -t -c 'SELECT COUNT(*) FROM files;'" 2>/dev/null | tr -d ' ')

echo "   Articles: $PROD_ARTICLES"
echo "   Writers: $PROD_WRITERS"
echo "   Files: $PROD_FILES"
echo ""

# Show difference
echo "📈 After database sync, you would have:"
echo "   Articles: $CURRENT_ARTICLES → $PROD_ARTICLES"
echo "   Writers: $CURRENT_WRITERS → $PROD_WRITERS" 
echo "   Files: $CURRENT_FILES → $PROD_FILES"
echo ""

if [ "$CURRENT_ARTICLES" != "$PROD_ARTICLES" ] || [ "$CURRENT_WRITERS" != "$PROD_WRITERS" ] || [ "$CURRENT_FILES" != "$PROD_FILES" ]; then
    echo "🔄 Database sync recommended - local data differs from production"
    echo ""
    echo "To sync:"
    echo "   bash database-sync/db-sync.sh"
else
    echo "✅ Local database appears to match production counts"
fi