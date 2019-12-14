/**
 * Встроенный скилл-сервер для просмотра изображений / прослушивания звуков.
 */
const fs = require('fs-extra');
const path = require('path');
const {promisify} = require('util');
const micro = require('micro');
const ms = require('ms');

/**
 *
 * @param {BaseManager} manager
 * @param {string} dbFile
 * @returns {Server}
 */
exports.createViewServer = (manager, {dbFile}) => {
  const responder = new Responder();
  const server = micro(async (req, res) => {
    if (req.method === 'POST') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      const {session, version} = await micro.json(req);
      const response = responder.getResponse();
      return {response, session, version};
    }
  });
  server.on('listening', async () => {
    const items = await manager.getItems();
    responder.setItems({items, dbFile});
  });
  server.listen = promisify(server.listen);
  server.close = promisify(server.close);
  return server;
};

class Responder {
  constructor() {
    this._items = [];
    this._index = -1;
  }

  setItems({items, dbFile}) {
    this._items = items;
    this._sortItemsByCreationTime();
    this._attachDataFromDbFile(dbFile);
  }

  getResponse() {
    return this._items.length
      ? this._getNextItemResponse()
      : this._getNoItemsResponse();
  }

  _getNextItemResponse() {
    this._calcNextIndex();
    const item = this._items[this._index];
    item.fileInfo = this._getFileInfo(item);
    const response = item.tts
      ? this._getSoundResponse(item)
      : this._getImageResponse(item);
    return {
      ...response,
      buttons: [
        {title: 'Дальше'}
      ],
      end_session: false,
    };
  }

  _getNoItemsResponse() {
    return {
      text: 'Не ресурсов на сервере.',
      end_session: false,
    };
  }

  _getSoundResponse({localId, fileInfo, error, tts}) {
    const text = [ error, localId, fileInfo ].filter(Boolean).join('\n');
    return { text, tts };
  }

  _getImageResponse({localId, fileInfo, id}) {
    return {
      text: '',
      card: {
        type: 'BigImage',
        image_id: id,
        title: localId || '',
        description: fileInfo
      },
    };
  }

  _sortItemsByCreationTime() {
    this._items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  _attachDataFromDbFile(dbFile) {
    if (dbFile) {
      const {ids, meta} = fs.readJsonSync(dbFile);
      const localIds = Object.keys(meta);
      this._items.forEach(item => {
        item.localId = localIds.find(localId => ids[localId] === item.id);
        item.originalName = path.basename(meta[item.localId].file);
      });
    }
  }

  _getFileInfo(item) {
    const sizeKb = Math.round(item.size / 1024);
    const createdDate = new Date(item.createdAt);
    const createdAgo = ms(Date.now() - createdDate.getTime(), { long: true });
    const originalName = item.originalName || '';
    return `${originalName} (~${createdAgo} ago, ${sizeKb}Kb)`.trim();
  }

  _calcNextIndex() {
    this._index = this._index === this._items.length - 1 ? 0 : this._index + 1;
  }
}
