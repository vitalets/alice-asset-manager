/**
 * Sound manager.
 */
const fs = require('fs-extra');
const path = require('path');
const BaseManager = require('./base-manager');
const SmartUploader = require('./smart-uploader');
const { createViewServer } = require('./view-server');

module.exports = class SoundManager extends BaseManager {
  /**
   * Создает инстанс менеджера звуков.
   *
   * @param {string} token OAuth-токен
   * @param {string} skillId идентификатор навыка
   */
  constructor({ token, skillId }) {
    const restUrl = `/skills/${skillId}/sounds`;
    super({ token, skillId, restUrl });
  }

  /**
   * Получить данные о занятом месте.
   *
   * @returns {Promise}
   */
  async getQuota() {
    const { sounds } = await super.getQuota();
    return sounds.quota;
  }

  /**
   * Получить список всех звуков на сервере.
   *
   * @returns {Promise}
   */
  async getItems() {
    const result = await super.getItems();
    return result.sounds.map(sound => {
      return {
        ...sound,
        tts: this.getTts(sound.id),
        url: this.getUrl(sound.id)
      };
    });
  }

  /**
   * Получить данные об отдельном звуке на сервере.
   *
   * @param {string} soundId
   * @returns {Promise}
   */
  async getItem(soundId) {
    const { sound } = await super.getItem(soundId);
    return {
      ...sound,
      tts: this.getTts(sound.id),
      url: this.getUrl(sound.id)
    };
  }

  /**
   * Загрузить звук из файла.
   *
   * @param {string} filePath путь до файла
   * @returns {Promise}
   */
  async upload(filePath) {
    const buffer = fs.createReadStream(filePath);
    const filename = path.basename(filePath);
    return this.uploadBuffer(buffer, filename);
  }

  /**
   * Загрузить звук из буфера.
   *
   * @param {Buffer|Stream} buffer данные
   * @param {string} filename имя файла
   * @returns {Promise}
   */
  async uploadBuffer(buffer, filename) {
    const { sound } = await super.uploadBuffer(buffer, filename);
    return {
      ...sound,
      tts: this.getTts(sound.id),
      url: this.getUrl(sound.id)
    };
  }

  /**
   * Удалить звук с сервера.
   *
   * @param {string} soundId
   * @returns {Promise}
   */
  async delete(soundId) {
    await super.delete(soundId);
  }

  /**
   * Получить ссылку на звук.
   *
   * @param {string} soundId
   * @returns {string}
   */
  getUrl(soundId) {
    return `https://yastatic.net/s3/dialogs/dialogs-upload/sounds/opus/${this._skillId}/${soundId}.opus`;
  }

  /**
   * Получить tts для вставки звука в ответ навыка.
   *
   * @param {string} soundId
   * @returns {string}
   */
  getTts(soundId) {
    return `<speaker audio="dialogs-upload/${this._skillId}/${soundId}.opus">`;
  }

  /**
   * Загрузить новые и измененные звуки на сервер.
   *
   * @param {string} pattern путь/паттерн до папки со звуками
   * @param {string} dbFile путь до файла с данными о загрузках
   * @param {function} [getLocalId] функция вычисления localId по имени файла
   * @param {function} [transform] функция обработки файлов (buffer, filepath) => buffer
   * @param {boolean} [dryRun=false] запуск без фактической загрузки файлов
   * @returns {Promise<Array>}
   */
  async uploadChanged({ pattern, dbFile, getLocalId, transform, dryRun }) {
    const uploader = new SmartUploader(this);
    return uploader.uploadChanged({ pattern, dbFile, getLocalId, transform, dryRun });
  }

  /**
   * Удалить неиспользуемые звуки с сервера.
   *
   * @param {string} dbFile путь до файла с данными о загрузках, созданный методом uploadChanged()
   * @param {boolean} [dryRun=false] запуск без фактического удаления звуков
   * @returns {Promise}
   */
  async deleteUnused({ dbFile, dryRun}) {
    const uploader = new SmartUploader(this);
    return uploader.deleteUnused({ dbFile, dryRun });
  }

  /**
   * Создает HTTP-сервер для прослушивания загруженных звуков через навык.
   *
   * @param {string} [dbFile] путь до файла с данными о загрузках, созданный методом uploadChanged()
   */
  createViewServer({ dbFile } = {}) {
    return createViewServer(this, { dbFile });
  }
};
