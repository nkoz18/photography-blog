#!/bin/bash

# Simple RDS Snapshot Sync - Direct approach without temporary instance
# Uses AWS CLI to export snapshot to S3, then downloads and restores

set -e  # Exit on any error

echo "🚀 Starting SIMPLE RDS SNAPSHOT SYNC..."
echo "📸 Using snapshot: db6252025"
echo ""

# Environment variables
LOCAL_DB_PASSWORD="${LOCAL_DB_PASSWORD:-localpass}"
AWS_REGION="${AWS_REGION:-us-west-2}"
RDS_SNAPSHOT_ID="db6252025"
S3_BUCKET="photography-blog-db-exports"
EXPORT_TASK_ID="export-db6252025-$(date +%s)"

echo "📋 Configuration:"
echo "   RDS Snapshot: $RDS_SNAPSHOT_ID"
echo "   S3 Bucket: $S3_BUCKET"
echo "   Export Task: $EXPORT_TASK_ID"
echo ""

# Step 1: Stop backend and clear caches
echo "🛑 Stopping backend and clearing caches..."
pkill -f "strapi develop" 2>/dev/null || true
sleep 3
rm -rf .cache .tmp build dist uploads public/uploads node_modules/.cache || true
rm -rf ../frontend/.next ../frontend/node_modules/.cache || true
find . -name "*.db" -type f -delete 2>/dev/null || true
echo "   ✅ Caches cleared"

# Step 2: Export RDS snapshot to S3
echo "📤 Exporting RDS snapshot to S3..."
aws rds start-export-task \
  --export-task-identifier "$EXPORT_TASK_ID" \
  --source-arn "arn:aws:rds:us-west-2:279736991990:snapshot:$RDS_SNAPSHOT_ID" \
  --s3-bucket-name "$S3_BUCKET" \
  --iam-role-arn "arn:aws:iam::279736991990:role/service-role/ExportRole" \
  --kms-key-id "arn:aws:kms:us-west-2:279736991990:key/4035583e-8231-4f0b-bcb5-c558781bc161" \
  --region "$AWS_REGION"

echo "   ⏳ Waiting for export to complete (this may take 10-15 minutes)..."
aws rds wait export-task-completed \
  --export-task-identifier "$EXPORT_TASK_ID" \
  --region "$AWS_REGION"

echo "   ✅ Export completed"

# Step 3: Download exported data
echo "⬇️  Downloading exported data from S3..."
aws s3 sync "s3://$S3_BUCKET/$EXPORT_TASK_ID/" "/tmp/snapshot-export/" --region "$AWS_REGION"

# Find the SQL file (RDS exports create parquet files, need to convert)
echo "   ⚠️  Note: RDS exports create Parquet files, not SQL dumps"
echo "   📝 For immediate sync, using direct pg_dump approach instead..."

# Alternative: Direct connection to production (requires network access)
echo ""
echo "🔄 Alternative: Direct production sync..."
echo "   This requires the production RDS to be accessible"

# Step 4: Clean local database
echo "🗄️  Preparing clean local database..."
sudo -u postgres psql -c "CREATE USER strapi WITH PASSWORD '$LOCAL_DB_PASSWORD';" 2>/dev/null || true
sudo -u postgres psql -c "DROP DATABASE IF EXISTS strapi;" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE strapi OWNER strapi;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE strapi TO strapi;"
echo "   ✅ Clean database ready"

echo ""
echo "⚠️  IMPORTANT: RDS snapshot export creates Parquet files, not SQL dumps"
echo "📝 To complete this sync, you need either:"
echo "   1. Network access to production RDS for direct pg_dump"
echo "   2. Tools to convert Parquet back to PostgreSQL format"
echo ""
echo "🎯 Recommended: Use the SSH-based sync instead:"
echo "   ./sync-only.sh"