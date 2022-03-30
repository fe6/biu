/**
 * /* global __webpack_dev_server_client__
 *
 * @format
 */

import clog from '@fe6/biu-utils/clog';
import WebSocketClient from './clients/WebSocketClient.js';

var Client =
  typeof __webpack_dev_server_client__ !== 'undefined'
    ? typeof __webpack_dev_server_client__.default !== 'undefined'
      ? __webpack_dev_server_client__.default
      : __webpack_dev_server_client__
    : WebSocketClient;

var retries = 0;
var maxRetries = 10;
var client = null;
/**
 * @param {string} url
 * @param {{ [handler: string]: (data?: any, params?: any) => any }} handlers
 * @param {number} [reconnect]
 */

var socket = function initSocket(url, handlers, reconnect) {
  client = new Client(url);
  client.onOpen(function () {
    retries = 0;

    if (typeof reconnect !== 'undefined') {
      maxRetries = reconnect;
    }
  });
  client.onClose(function () {
    if (retries === 0) {
      handlers.close();
    } // Try to reconnect.

    client = null; // After 10 retries stop trying, to prevent logspam.

    if (retries < maxRetries) {
      // Exponentially increase timeout to reconnect.
      // Respectfully copied from the package `got`.
      var retryInMs = 1000 * Math.pow(2, retries) + Math.random() * 100;
      retries += 1;
      clog.info('Trying to reconnect...');
      setTimeout(function () {
        socket(url, handlers, reconnect);
      }, retryInMs);
    }
  });
  client.onMessage(
    /**
     * @param {any} data
     */
    function (data) {
      var message = JSON.parse(data);

      if (handlers[message.type]) {
        handlers[message.type](message.data, message.params);
      }
    },
  );
};

export default socket;
