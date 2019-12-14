const fs = require('fs-extra');
const path = require('path');
const fetch = require('node-fetch');
const FormData = require('form-data');
const {throwIf} = require('throw-utils');
const {stringify} = require('./utils');

const BASE_URL = 'https://dialogs.yandex.net/api/v1';
const REQUEST_TIMEOUT = 5000;

module.exports = class BaseManager {
  /**
   * Constructor.
   *
   * @param {string} token
   * @param {string} skillId
   * @param {string} restUrl
   * @param {number} [timeout]
   */
  constructor({ token, skillId, restUrl, timeout }) {
    this._token = token;
    this._skillId = skillId;
    this._restUrl = restUrl;
    this._timeout = timeout || REQUEST_TIMEOUT;
  }

  get skillId() {
    return this._skillId;
  }

  async getQuota() {
    return this._request('/status');
  }

  async getItems() {
    return this._request(this._restUrl);
  }

  async getItem(id) {
    throwIf(!stringify(id), `Empty item id: ${id}`);
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
    throwIf(!stringify(id), `Empty item id: ${id}`);
    const url = `${this._restUrl}/${id}`;
    const result = await this._request(url, {method: 'delete'});
    throwIf(!result || result.result !== 'ok', `Error while deleting item ${url}: ${result}`);
  }

  async _request(url, options = {}) {
    const fullUrl = `${BASE_URL}${url}`;
    options.headers = Object.assign({
      Authorization: `OAuth ${this._token}`,
      timeout: this._timeout,
    }, options.headers);
    const response = await fetch(fullUrl, options);
    if (response.ok) {
      return response.json();
    } else {
      const text = await response.text();
      const method = (options.method || 'get').toUpperCase();
      throw new Error(`${response.status} ${text} ${method} ${url}`);
    }
  }
};
