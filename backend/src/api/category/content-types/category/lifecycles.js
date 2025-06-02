const { triggerAmplifyRebuild } = require('../../../../utils/amplify-rebuild');

module.exports = {
  async afterCreate(event) {
    const { result } = event;
    console.log(`Category created: ${result.name || result.id}`);
    await triggerAmplifyRebuild('Category created');
  },

  async afterUpdate(event) {
    const { result } = event;
    console.log(`Category updated: ${result.name || result.id}`);
    await triggerAmplifyRebuild('Category updated');
  },

  async afterDelete(event) {
    console.log('Category deleted');
    await triggerAmplifyRebuild('Category deleted');
  },
};