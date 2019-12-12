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
  }

  async getQuota() {
    return (await super.getQuota()).sounds.quota;
  }

  async getItems() {
    return (await super.getItems()).sounds;
  }

  async getItem(soundId) {
    return (await super.getItem(soundId)).sound;
  }

  async upload(filePath) {
    return (await super.upload(filePath)).sound;
  }

  async delete(soundId) {
    return super.delete(soundId);
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
