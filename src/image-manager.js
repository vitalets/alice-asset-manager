/**
 * Image manager.
 */
const BaseManager = require('./base-manager');

module.exports = class SoundManager extends BaseManager {
  /**
   * Constructor.
   *
   * @param token
   * @param skillId
   */
  constructor({ token, skillId }) {
    const restUrl = `/skills/${skillId}/images`;
    super({ token, restUrl });
  }

  async getQuota() {
    return (await super.getQuota()).images.quota;
  }

  async getItems() {
    return (await super.getItems()).images;
  }

  async getItem(imageId) {
    const images = await this.getItems();
    return images.find(image => image.id === imageId);
  }

  async upload(filePath) {
    return (await super.upload(filePath)).image;
  }

  async delete(imageId) {
    return super.delete(imageId);
  }
};
