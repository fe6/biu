/**
 * /*
 * 	MIT License http://www.opensource.org/licenses/mit-license.php
 * 	Author Tobias Koppers @sokra
 *
 * @format
 */

/* globals __webpack_hash__ */
if (module.hot) {
  var lastHash;
  var upToDate = function upToDate() {
    return lastHash.indexOf(__webpack_hash__) >= 0;
  };
  var log = require('./log');
  var check = function check() {
    module.hot
      .check(true)
      .then(function (updatedModules) {
        if (!updatedModules) {
          log.warnHmr('Cannot find update. Need to do a full reload!');
          log.warnHmr('Probably because of restarting the BIU');
          console.log('reload 1');
          // window.location.reload();
          return;
        }

        if (!upToDate()) {
          check();
        }

        require('./log-apply-result')(updatedModules, updatedModules);

        if (upToDate()) {
          log.readyHmr('App is up to date.');
        }
      })
      .catch(function (err) {
        var status = module.hot.status();
        if (['abort', 'fail'].indexOf(status) >= 0) {
          log.errorHmr('Cannot apply update. Need to do a full reload!');
          log.errorHmr('' + err);
          console.log('reload 2');

          // window.location.reload();
        } else {
          log.errorHmr('Update failed: ' + err);
        }
      });
  };
  var hotEmitter = require('./emitter');
  hotEmitter.on('webpackHotUpdate', function (currentHash) {
    lastHash = currentHash;
    if (!upToDate() && module.hot.status() === 'idle') {
      log.infoHmr('Checking for updates on the server...');
      check();
    }
  });
  log.waitHmr('Waiting for update signal from WDS...');
} else {
  log.errorHmr('Hot Module Replacement is disabled.');
}
