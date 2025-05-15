# Set environment variables
$env:NODE_OPTIONS = "--openssl-legacy-provider"
$env:NEXT_TELEMETRY_DISABLED = "1"

# Start Next.js in development mode
Write-Output "Starting Next.js frontend in development mode..."
yarn dev

# Or use npm if preferred
# npm run dev 