// Centralized Amplify rebuild trigger with rate limiting
let lastRebuildTime = 0;
const MIN_INTERVAL = 5 * 60 * 1000; // 5 minutes

async function triggerAmplifyRebuild(reason) {
  try {
    // Check if webhook URL is configured
    const webhookUrl = process.env.AMPLIFY_WEBHOOK_URL;
    
    if (!webhookUrl) {
      console.log('AMPLIFY_WEBHOOK_URL not configured, skipping rebuild trigger');
      return false;
    }

    // Implement rate limiting to avoid too many rebuilds
    const now = Date.now();
    
    if (now - lastRebuildTime < MIN_INTERVAL) {
      const secondsSinceLastRebuild = Math.floor((now - lastRebuildTime) / 1000);
      console.log(`Skipping Amplify rebuild, last rebuild was ${secondsSinceLastRebuild} seconds ago (minimum interval: ${MIN_INTERVAL / 1000} seconds)`);
      return false;
    }

    // Update last rebuild time
    lastRebuildTime = now;

    // Trigger the webhook
    console.log(`Triggering Amplify rebuild: ${reason}`);
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reason,
        timestamp: new Date().toISOString(),
        source: 'strapi-cms',
      }),
    });

    if (!response.ok) {
      console.error('Failed to trigger Amplify rebuild:', response.statusText);
      return false;
    } else {
      console.log('Successfully triggered Amplify rebuild');
      return true;
    }
  } catch (error) {
    console.error('Error triggering Amplify rebuild:', error);
    return false;
  }
}

module.exports = {
  triggerAmplifyRebuild,
  MIN_INTERVAL,
};