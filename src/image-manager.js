/**
 * Image manager.
 */
const BaseManager = require('./base-manager');
const SmartUploader = require('./smart-uploader');

module.exports = class ImageManager extends BaseManager {
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

  /**
   * Uploads changed items from directory and updates dbFile.
   *
   * @param {string} pattern
   * @param {string} dbFile
   * @param {function} [getLocalId]
   * @param {boolean} [dryRun=false]
   * @returns {Promise}
   */
  async uploadChanged({pattern, dbFile, dryRun, getLocalId}) {
    const uploader = new SmartUploader(this);
    return uploader.uploadChanged({pattern, dbFile, dryRun, getLocalId});
  }
};
