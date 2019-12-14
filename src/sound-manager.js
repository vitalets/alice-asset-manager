/**
 * Sound manager.
 */
const BaseManager = require('./base-manager');
const SmartUploader = require('./smart-uploader');

module.exports = class SoundManager extends BaseManager {
  /**
   * Constructor.
   *
   * @param token
   * @param skillId
   */
  constructor({ token, skillId }) {
    const restUrl = `/skills/${skillId}/sounds`;
    super({ token, restUrl });
    this._skillId = skillId;
  }

  async getQuota() {
    const { sounds } = await super.getQuota();
    return sounds.quota;
  }

  async getItems() {
    const result = await super.getItems();
    return result.sounds.map(sound => {
      return {
        ...sound,
        url: this.getUrl(sound.id)
      };
    });
  }

  async getItem(soundId) {
    const { sound } = await super.getItem(soundId);
    return {
      ...sound,
      url: this.getUrl(sound.id)
    };
  }

  async upload(filePath) {
    const { sound } = await super.upload(filePath);
    return {
      ...sound,
      url: this.getUrl(sound.id)
    };
  }

  async delete(soundId) {
    await super.delete(soundId);
  }

  /**
   * Returns url for sound.
   *
   * @param {string} soundId
   */
  getUrl(soundId) {
    return `https://yastatic.net/s3/dialogs/dialogs-upload/sounds/opus/${this._skillId}/${soundId}.opus`;
  }

  /**
   * Uploads changed items from directory and updates dbFile.
   *
   * @param {string} pattern
   * @param {string} dbFile
   * @param {function} getLocalId
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
