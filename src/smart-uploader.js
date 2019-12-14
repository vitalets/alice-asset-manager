/**
 * Smart uploader - uploads only changed files.
 */
const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const {throwIf} = require('throw-utils');
const {stringify} = require('./utils');

// By default extract localId as '[local_id]' at the end of filename
const getLocalIdDefault = file => {
  const matches = path.basename(file).match(/\[(.+?)\]/);
  return matches && matches[1];
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

  async uploadChanged({pattern, dbFile, dryRun, getLocalId}) {
    const files = this._getFiles(pattern);
    this._createLocalItems(files, getLocalId);
    this._readDbFile(dbFile);
    await this._loadRemoteItems();
    this._markLocalItemsForUpload();
    if (!dryRun) {
      await this._upload();
      this._saveDbFile();
    }
    return {
      uploaded: this._localItems.filter(item => item.upload).map(item => item.file),
      skipped: this._localItems.filter(item => !item.upload).map(item => item.file),
    };
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
    if (!id || mtimeMs !== localItem.mtimeMs || !this._hasRemoteItem(id)) {
      localItem.upload = true;
    } else {
      localItem.id = id;
    }
  }

  _getFiles(pattern) {
    throwIf(!pattern, `pattern is required.`);
    return glob.sync(pattern, {nodir: true});
  }

  _createLocalItems(files, getLocalId) {
    getLocalId = getLocalId || getLocalIdDefault;
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

  async _upload() {
    const tasks = this._localItems
      .filter(localItem => localItem.upload)
      .map(async localItem => {
        const { id } = await this._manager.upload(localItem.file);
        localItem.id = id;
      });
    await Promise.all(tasks);
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

  _saveDbFile() {
    const newDbFileData = {};
    // сортируем по localId, чтобы удобнее было смотреть в dbFile
    this._localItems.sort((a, b) => a.localId.localeCompare(b.localId));
    // записываем id-шники в отдельное свойство ids для удобного доступа
    newDbFileData.ids = {};
    this._localItems.forEach(({localId, id}) => newDbFileData.ids[localId] = id);
    // для звуков записываем еще поле tts, так  удобнее использовать их в коде навыка
    if (this._manager.getTts) {
      newDbFileData.tts = {};
      this._localItems.forEach(({localId, id}) => newDbFileData.tts[localId] = this._manager.getTts(id));
    }
    // имя файла и дату моюицикации пишем в поле meta
    newDbFileData.meta = {};
    this._localItems.forEach(({file, localId, mtimeMs, id}) => {
      const url = this._manager.getUrl(id);
      newDbFileData.meta[localId] = { file, url, mtimeMs };
    });
    fs.outputJsonSync(this._dbFile, newDbFileData, {spaces: 2});
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

