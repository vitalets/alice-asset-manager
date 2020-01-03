const fetch = require('node-fetch');
const FormData = require('form-data');
const debug = require('debug')('alice-asset-manager');
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

  /**
   * Uploads buffer.
   *
   * @param {Buffer|Stream} buffer
   * @param {string} filename
   * @returns {Promise}
   */
  async uploadBuffer(buffer, filename) {
    const formData = new FormData();
    formData.append('file', buffer, { filename });
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
    options = this._buildOptions(options);
    debug(options.method, fullUrl);
    const response = await fetch(fullUrl, options);
    if (response.ok) {
      const json = await response.json();
      debug(response.status, json);
      return json;
    } else {
      const text = await response.text();
      throw new Error(`${response.status} ${text} ${options.method} ${url}`);
    }
  }

  _buildOptions(options) {
    options.method = (options.method || 'GET').toUpperCase();
    options.headers = Object.assign({
      Authorization: `OAuth ${this._token}`,
      timeout: this._timeout,
    }, options.headers);
    return options;
  }
};
