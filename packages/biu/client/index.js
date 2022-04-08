/**
 * /* global __resourceQuery, __webpack_hash__
 *
 * @format
 */

import clog from '@fe6/biu-utils/clog';
import stripAnsi from './utils/stripAnsi.js';
import parseURL from './utils/parseURL.js';
import socket from './socket.js';
import { formatProblem, show, hide } from './overlay.js';
import sendMessage from './utils/sendMessage.js';
import reloadApp from './utils/reloadApp.js';
import createSocketURL from './utils/createSocketURL.js';
/**
 * @typedef {Object} Options
 * @property {boolean} hot
 * @property {boolean} liveReload
 * @property {boolean} progress
 * @property {boolean | { warnings?: boolean, errors?: boolean }} overlay
 * @property {string} [logging]
 * @property {number} [reconnect]
 */

/**
 * @typedef {Object} Status
 * @property {boolean} isUnloading
 * @property {string} currentHash
 * @property {string} [previousHash]
 */

/**
 * @type {Status}
 */

var status = {
  isUnloading: false,
  // TODO Workaround for webpack v4, `__webpack_hash__` is not replaced without HotModuleReplacement
  currentHash: typeof __webpack_hash__ !== 'undefined' ? __webpack_hash__ : '',
};
/** @type {Options} */

var options = {
  hot: false,
  liveReload: false,
  progress: false,
  overlay: false,
};
var parsedResourceQuery = parseURL(__resourceQuery);

if (parsedResourceQuery.hot === 'true') {
  options.hot = true;
  clog.info('Hot Module Replacement enabled.');
}

if (parsedResourceQuery['live-reload'] === 'true') {
  options.liveReload = true;
  clog.info('Live Reloading enabled.');
}

if (parsedResourceQuery.logging) {
  options.logging = parsedResourceQuery.logging;
}

if (typeof parsedResourceQuery.reconnect !== 'undefined') {
  options.reconnect = Number(parsedResourceQuery.reconnect);
}

self.addEventListener('beforeunload', function () {
  status.isUnloading = true;
});
var onSocketMessage = {
  hot: function hot() {
    if (parsedResourceQuery.hot === 'false') {
      return;
    }

    options.hot = true;
    clog.info('Hot Module Replacement enabled.');
  },
  liveReload: function liveReload() {
    if (parsedResourceQuery['live-reload'] === 'false') {
      return;
    }

    options.liveReload = true;
    clog.info('Live Reloading enabled.');
  },
  invalid: function invalid() {
    clog.info('App updated. Recompiling...'); // Fixes #1042. overlay doesn't clear if errors are fixed but warnings remain.

    if (options.overlay) {
      hide();
    }

    sendMessage('Invalid');
  },

  /**
   * @param {string} hash
   */
  hash: function hash(_hash) {
    status.previousHash = status.currentHash;
    status.currentHash = _hash;
  },

  /**
   * @param {boolean} value
   */
  overlay: function overlay(value) {
    if (typeof document === 'undefined') {
      return;
    }

    options.overlay = value;
  },

  /**
   * @param {number} value
   */
  reconnect: function reconnect(value) {
    if (parsedResourceQuery.reconnect === 'false') {
      return;
    }

    options.reconnect = value;
  },

  /**
   * @param {boolean} value
   */
  progress: function progress(value) {
    options.progress = value;
  },

  /**
   * @param {{ pluginName?: string, percent: number, msg: string }} data
   */
  'progress-update': function progressUpdate(data) {
    if (options.progress) {
      clog.info(
        ''
          .concat(data.pluginName ? '['.concat(data.pluginName, '] ') : '')
          .concat(data.percent, '% - ')
          .concat(data.msg, '.'),
      );
    }

    sendMessage('Progress', data);
  },
  'still-ok': function stillOk() {
    clog.info('Nothing changed.');

    if (options.overlay) {
      hide();
    }

    sendMessage('StillOk');
  },
  ok: function ok() {
    sendMessage('Ok');

    if (options.overlay) {
      hide();
    }

    reloadApp(options, status);
  },
  // TODO: remove in v5 in favor of 'static-changed'

  /**
   * @param {string} file
   */
  'content-changed': function contentChanged(file) {
    clog.info(
      ''.concat(
        file ? '"'.concat(file, '"') : 'Content',
        ' from static directory was changed. Reloading...',
      ),
    );
    console.log('reload 12222');
    // self.location.reload();
  },

  /**
   * @param {string} file
   */
  'static-changed': function staticChanged(file) {
    clog.info(
      ''.concat(
        file ? '"'.concat(file, '"') : 'Content',
        ' from static directory was changed. Reloading...',
      ),
    );
    console.log('reload 12');
    // self.location.reload();
  },

  /**
   * @param {Error[]} warnings
   * @param {any} params
   */
  warnings: function warnings(_warnings, params) {
    clog.warn('Warnings while compiling.');

    var printableWarnings = _warnings.map(function (error) {
      var _formatProblem = formatProblem('warning', error),
        header = _formatProblem.header,
        body = _formatProblem.body;

      return ''.concat(header, '\n').concat(stripAnsi(body));
    });

    sendMessage('Warnings', printableWarnings);

    for (var i = 0; i < printableWarnings.length; i++) {
      clog.warn(printableWarnings[i]);
    }

    var needShowOverlayForWarnings =
      typeof options.overlay === 'boolean'
        ? options.overlay
        : options.overlay && options.overlay.warnings;

    if (needShowOverlayForWarnings) {
      show('warning', _warnings);
    }

    if (params && params.preventReloading) {
      return;
    }

    reloadApp(options, status);
  },

  /**
   * @param {Error[]} errors
   */
  errors: function errors(_errors) {
    clog.error('Errors while compiling. Reload prevented.');

    var printableErrors = _errors.map(function (error) {
      var _formatProblem2 = formatProblem('error', error),
        header = _formatProblem2.header,
        body = _formatProblem2.body;

      return ''.concat(header, '\n').concat(stripAnsi(body));
    });

    sendMessage('Errors', printableErrors);

    for (var i = 0; i < printableErrors.length; i++) {
      clog.error(printableErrors[i]);
    }

    var needShowOverlayForErrors =
      typeof options.overlay === 'boolean'
        ? options.overlay
        : options.overlay && options.overlay.errors;

    if (needShowOverlayForErrors) {
      show('error', _errors);
    }
  },

  /**
   * @param {Error} error
   */
  error: function error(_error) {
    clog.error(_error);
  },
  close: function close() {
    clog.info('Disconnected!');

    if (options.overlay) {
      hide();
    }

    sendMessage('Close');
  },
};
var socketURL = createSocketURL(parsedResourceQuery);
socket(socketURL, onSocketMessage, options.reconnect);
