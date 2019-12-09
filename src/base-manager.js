const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const FormData = require('form-data');
const {throwIf} = require('throw-utils');

const BASE_URL = 'https://dialogs.yandex.net/api/v1';

module.exports = class BaseManager {
  /**
   * Constructor.
   *
   * @param token
   * @param restUrl
   */
  constructor({ token, restUrl }) {
    this._token = token;
    this._restUrl = restUrl;
  }

  async getQuota() {
    return this._request('/status');
  }

  async getItems() {
    return this._request(this._restUrl);
  }

  async getItem(id) {
    BaseManager._assertItemId(id);
    return this._request(`${this._restUrl}/${id}`);
  }

  async upload(filePath) {
    const formData = new FormData();
    const filename = path.basename(filePath);
    formData.append('file', fs.createReadStream(filePath), {filename});
    return this._request(this._restUrl, {
      method: 'post',
      headers: formData.getHeaders(),
      body: formData,
    });
  }

  /**
   * @param {string|number} id
   * @returns {Promise}
   */
  async delete(id) {
    BaseManager._assertItemId(id);
    const url = `${this._restUrl}/${id}`;
    const result = await this._request(url, {method: 'delete'});
    throwIf(!result || result.result !== 'ok', `Error while deleting item ${url}: ${result}`);
  }

  // /**
  //  * Uploads changed images from directory and updates dbFile.
  //  *
  //  * @param dir
  //  * @param dbFile
  //  * @param getId
  //  * @returns {Promise}
  //  */
  // async uploadChanged({dir, dbFile, getId}) {
  //
  // }
  //
  // /**
  //  * Uploads changed images from directory and updates dbFile.
  //  *
  //  * @param dbFile
  //  * @param dryRun
  //  * @returns {Promise}
  //  */
  // async deleteUnused({dbFile, dryRun}) {
  //
  // }

  async _request(url, options = {}) {
    const fullUrl = `${BASE_URL}${url}`;
    options.headers = Object.assign({ Authorization: `OAuth ${this._token}` }, options.headers);
    const response = await fetch(fullUrl, options);
    if (response.ok) {
      return response.json();
    } else {
      const text = await response.text();
      const method = (options.method || 'get').toUpperCase();
      throw new Error(`${response.status} ${text} ${method} ${url}`);
    }
  }

  static _assertItemId(id) {
    id = typeof id === 'number' ? String(id) : id;
    throwIf(!id, `Empty item id: ${id}`);
  }
};
