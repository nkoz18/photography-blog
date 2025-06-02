const { triggerAmplifyRebuild } = require('../../../../utils/amplify-rebuild');

module.exports = {
  async afterCreate(event) {
    const { result } = event;
    console.log(`Article created: ${result.title || result.id}`);
    
    // Only trigger rebuild for published articles
    if (result.publishedAt) {
      await triggerAmplifyRebuild('Article created and published');
    }
  },

  async afterUpdate(event) {
    const { result, params } = event;
    console.log(`Article updated: ${result.title || result.id}`);
    
    // Trigger rebuild for any article update (published or draft)
    // The frontend filters by publishedAt anyway
    await triggerAmplifyRebuild('Article updated');
  },

  async afterDelete(event) {
    console.log('Article deleted');
    await triggerAmplifyRebuild('Article deleted');
  },
};