/**
 * Smart uploader - uploads only changed files.
 */
const fs = require('fs-extra');
const path = require('path');
const fg = require('fast-glob');
const {throwIf} = require('throw-utils');
const {stringify} = require('./utils');

const defaults = {
  // By default extract localId as '[local_id]' at the end of filename
  getLocalId: file => {
    const matches = path.basename(file).match(/\[(.+?)\]/);
    return matches && matches[1];
  },
  transform: (buffer, filePath) => buffer, // eslint-disable-line no-unused-vars
};

module.exports = class SmartUploader {
  /**
   * Constructor.
   *
   * @param {object} manager
   */
  constructor(manager) {
    this._manager = manager;
    // список локальных файлов (полученных из glob) с рассчитанными localId.
    // localId - это некий локальный ID файла, который вычисляется из имени файла и не меняется при переименовании.
    // именно по localId происходит получение imageId / soundId в навыке.
    this._localItems = null;
    // список файлов на севере
    this._remoteItems = null;
    // файл, который используется как бд для вычисления измененных файлов между вызовами
    this._dbFile = null;
    this._dbFileData = null;
  }

  async uploadChanged({ pattern, dbFile, getLocalId, transform, dryRun }) {
    const files = this._getFiles(pattern);
    this._createLocalItems(files, getLocalId);
    this._readDbFile(dbFile);
    await this._loadRemoteItems();
    this._markLocalItemsForUpload();
    await this._upload({ transform, dryRun });
    this._saveDbFile({ dryRun });
    return this._localItems;
  }

  /**
   * Delete items not in dbFile.
   *
   * @param {string} dbFile
   * @param {boolean} [dryRun=false]
   * @returns {Promise}
   */
  async deleteUnused({dbFile, dryRun}) {
    this._readDbFile(dbFile);
    await this._loadRemoteItems();
    const unusedRemoteIds = this._getUnusedRemoteIds();
    if (!dryRun) {
      const tasks = unusedRemoteIds.map(id => this._manager.delete(id));
      await Promise.all(tasks);
    }
    const {ids, meta} = this._dbFileData;
    return {
      deleted: unusedRemoteIds,
      used: Object.keys(ids)
        .filter(localId => !unusedRemoteIds.includes(ids[localId]))
        .map(localId => meta[localId].file)
    };
  }

  _markLocalItemsForUpload() {
    this._localItems.forEach(localItem => this._markLocalItemForUpload(localItem));
  }

  _markLocalItemForUpload(localItem) {
    const {id, mtimeMs} = this._getDbFileItemInfo(localItem.localId) || {};
    // загружаем файл, если он не был загружен или изменилась дата модификации или его нет на сервере
    if (!id) {
      localItem.upload = 'new';
    } else if (mtimeMs !== localItem.mtimeMs) {
      localItem.upload = 'changed';
    } else if (!this._hasRemoteItem(id)) {
      localItem.upload = 'deleted_on_server';
    } else {
      localItem.id = id;
    }
  }

  _getFiles(pattern) {
    throwIf(!pattern, `pattern is required.`);
    return fg.sync(pattern, { onlyFiles: true });
  }

  _createLocalItems(files, getLocalId) {
    getLocalId = getLocalId || defaults.getLocalId;
    this._localItems = files.map(file => {
      const localId = stringify(getLocalId(file));
      this._assertLocalId(localId, file);
      const { mtimeMs } = fs.statSync(file);
      return { file, localId, mtimeMs };
    });
    this._assertLocalIdDuplicates();
  }

  async _loadRemoteItems() {
    this._remoteItems = await this._manager.getItems();
  }

  async _upload({ transform, dryRun }) {
    transform = transform || defaults.transform;
    const localItemToUpload = this._localItems.filter(localItem => localItem.upload);
    for (const localItem of localItemToUpload) {
      const buffer = await fs.readFile(localItem.file);
      const transformedBuffer = await transform(buffer, localItem.file);
      if (!dryRun) {
        const {id} = await this._manager.uploadBuffer(transformedBuffer, localItem.file);
        localItem.id = id;
      }
    }
  }

  _getDbFileItemInfo(localId) {
    if (this._dbFileData) {
      const { ids, meta } = this._dbFileData;
      return {
        id: ids[localId],
        mtimeMs: meta[localId] && meta[localId].mtimeMs,
      };
    }
  }

  _getUnusedRemoteIds() {
    throwIf(!this._dbFileData, `dbFile not found: ${this._dbFile}`);
    const { ids } = this._dbFileData;
    const usedIds = Object.values(ids);
    return this._remoteItems
      .map(item => item.id)
      .filter(id => !usedIds.includes(id));
  }

  _hasRemoteItem(id) {
    return this._remoteItems.some(item => item.id === id);
  }

  _readDbFile(dbFile) {
    throwIf(!dbFile, `dbFile is required.`);
    this._dbFile = dbFile;
    if (fs.existsSync(dbFile)) {
      this._dbFileData = fs.readJsonSync(dbFile);
    }
  }

  _saveDbFile({ dryRun }) {
    const newDbFileData = this._buildDbFileData();
    if (!dryRun) {
      fs.outputJsonSync(this._dbFile, newDbFileData, {spaces: 2});
    }
  }

  _buildDbFileData() {
    const newDbFileData = {};

    // сортируем по localId, чтобы удобнее было смотреть в dbFile
    this._localItems.sort((a, b) => a.localId.localeCompare(b.localId));

    // записываем id-шники в отдельное свойство ids для удобного доступа
    newDbFileData.ids = {};
    this._localItems.forEach(({localId, id}) => newDbFileData.ids[localId] = id);
    // для звуков записываем еще поле tts, так удобнее использовать их в коде навыка
    if (this._manager.getTts) {
      newDbFileData.tts = {};
      this._localItems.forEach(({localId, id}) => newDbFileData.tts[localId] = this._manager.getTts(id));
    }

    // имя файла и дату модификации пишем в поле meta
    newDbFileData.meta = {};
    this._localItems.forEach(({file, localId, mtimeMs, id}) => {
      const url = this._manager.getUrl(id);
      newDbFileData.meta[localId] = { file, url, mtimeMs };
    });

    return newDbFileData;
  }

  _assertLocalIdDuplicates() {
    const map = {};
    this._localItems.forEach(({file, localId}) => {
      map[localId] = map[localId] || [];
      map[localId].push(file);
    });
    Object.keys(map).forEach(key => map[key].length === 1 && delete map[key]);
    throwIf(Object.keys(map).length, `Дубликаты localId:\n ${JSON.stringify(map, null, 2)}`);
  }

  _assertLocalId(localId, file) {
    throwIf(!localId,  `Пустой localId "${localId}" для файла: ${file}`);
    throwIf(typeof localId !== 'string',  `Некорректный localId "${localId}" для файла: ${file}`);
  }
};

