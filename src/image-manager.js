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
    const { images } = await super.getQuota();
    return images.quota;
  }

  async getItems() {
    const result = await super.getItems();
    return result.images.map(image => {
      return {
        ...image,
        url: this.getUrl(image.id)
      };
    });
  }

  async getItem(imageId) {
    const images = await this.getItems();
    return images.find(image => image.id === imageId);
  }

  async upload(filePath) {
    const { image } = await super.upload(filePath);
    return {
      ...image,
      url: this.getUrl(image.id)
    };
  }

  async delete(imageId) {
    await super.delete(imageId);
    return this.getUrl(imageId);
  }

  /**
   * Returns url for image.
   *
   * @param {string} imageId
   */
  getUrl(imageId) {
    return `https://avatars.mds.yandex.net/get-dialogs-skill-card/${imageId}/orig`;
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

  /**
   * Delete items not found in dbFile (actually not used in skill).
   *
   * @param {string} dbFile
   * @param {boolean} [dryRun=false]
   * @returns {Promise}
   */
  async deleteUnused({ dbFile, dryRun}) {
    const uploader = new SmartUploader(this);
    return uploader.deleteUnused({ dbFile, dryRun });
  }
};
