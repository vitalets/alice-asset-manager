/**
 * Image manager.
 */
const BaseManager = require('./base-manager');
const SmartUploader = require('./smart-uploader');
const { createViewServer } = require('./view-server');

module.exports = class ImageManager extends BaseManager {
  /**
   * Создает инстанс менеджера изображений.
   *
   * @param {string} token OAuth-токен
   * @param {string} skillId идентификатор навыка
   */
  constructor({ token, skillId }) {
    const restUrl = `/skills/${skillId}/images`;
    super({ token, restUrl });
  }

  /**
   * Получить данные о занятом месте.
   *
   * @returns {Promise}
   */
  async getQuota() {
    const { images } = await super.getQuota();
    return images.quota;
  }

  /**
   * Получить список всех изображений на сервере.
   *
   * @returns {Promise}
   */
  async getItems() {
    const result = await super.getItems();
    return result.images.map(image => {
      return {
        ...image,
        url: this.getUrl(image.id)
      };
    });
  }

  /**
   * Получить данные об отдельном изображении.
   *
   * @param {string} imageId
   * @returns {Promise}
   */
  async getItem(imageId) {
    const images = await this.getItems();
    return images.find(image => image.id === imageId);
  }

  /**
   * Загрузить изображение из файла.
   *
   * @param {string} filePath путь до файла
   * @returns {Promise}
   */
  async upload(filePath) {
    const { image } = await super.upload(filePath);
    return {
      ...image,
      url: this.getUrl(image.id)
    };
  }

  /**
   * Удалить изображение с сервера.
   *
   * @param {string} imageId
   * @returns {Promise}
   */
  async delete(imageId) {
    await super.delete(imageId);
  }

  /**
   * Получить ссылку на изображение.
   *
   * @param {string} imageId
   * @returns {string}
   */
  getUrl(imageId) {
    return `https://avatars.mds.yandex.net/get-dialogs-skill-card/${imageId}/orig`;
  }

  /**
   * Загрузить новые и измененные изображения на сервер.
   *
   * @param {string} pattern путь/паттерн до папки с изображениями
   * @param {string} dbFile путь до файла с данными о загрузках
   * @param {function} [getLocalId] функция вычисления localId по имени файла
   * @param {boolean} [dryRun=false] запуск без фактической загрузки файлов
   * @returns {Promise}
   */
  async uploadChanged({pattern, dbFile, dryRun, getLocalId}) {
    const uploader = new SmartUploader(this);
    return uploader.uploadChanged({pattern, dbFile, dryRun, getLocalId});
  }

  /**
   * Удалить неиспользуемые изображения с сервера.
   *
   * @param {string} dbFile путь до файла с данными о загрузках, созданный методом uploadChanged()
   * @param {boolean} [dryRun=false] запуск без фактического удаления изображений
   * @returns {Promise}
   */
  async deleteUnused({ dbFile, dryRun}) {
    const uploader = new SmartUploader(this);
    return uploader.deleteUnused({ dbFile, dryRun });
  }

  /**
   * Создает HTTP-сервер для просмотра загруженных изображений прямо на устройстве.
   *
   * @param {string} [dbFile] путь до файла с данными о загрузках, созданный методом uploadChanged()
   */
  createViewServer({ dbFile } = {}) {
    return createViewServer(this, { dbFile });
  }
};
