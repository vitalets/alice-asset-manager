/**
 * Sound manager.
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
};
