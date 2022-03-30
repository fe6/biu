/**
 * /*
 * 	MIT License http://www.opensource.org/licenses/mit-license.php
 * 	Author Tobias Koppers @sokra
 *
 * @format
 */

/*globals __webpack_hash__ */
if (module.hot) {
  var lastHash;
  var upToDate = function upToDate() {
    return lastHash.indexOf(__webpack_hash__) >= 0;
  };
  var log = require('./log');
  var check = function check() {
    module.hot
      .check()
      .then(function (updatedModules) {
        if (!updatedModules) {
          log.warnHmr('Cannot find update. Need to do a full reload!');
          log.warnHmr('Probably because of restarting the webpack-dev-server');
          return;
        }

        return module.hot
          .apply({
            ignoreUnaccepted: true,
            ignoreDeclined: true,
            ignoreErrored: true,
            onUnaccepted: function (data) {
              log.warn(
                'Ignored an update to unaccepted module ' +
                  data.chain.join(' -> '),
              );
            },
            onDeclined: function (data) {
              log.warn(
                'Ignored an update to declined module ' +
                  data.chain.join(' -> '),
              );
            },
            onErrored: function (data) {
              log.error(data.error);
              log.warn(
                'Ignored an error while updating module ' +
                  data.moduleId +
                  ' (' +
                  data.type +
                  ')',
              );
            },
          })
          .then(function (renewedModules) {
            if (!upToDate()) {
              check();
            }

            require('./log-apply-result')(updatedModules, renewedModules);

            if (upToDate()) {
              log.infoHmr('App is up to date.');
            }
          });
      })
      .catch(function (err) {
        var status = module.hot.status();
        if (['abort', 'fail'].indexOf(status) >= 0) {
          log.warnHmr('Cannot check for update. Need to do a full reload!');
          log.warnHmr(err);
        } else {
          log.warnHmr(err);
        }
      });
  };
  var hotEmitter = require('./emitter');
  hotEmitter.on('webpackHotUpdate', function (currentHash) {
    lastHash = currentHash;
    if (!upToDate()) {
      var status = module.hot.status();
      if (status === 'idle') {
        log.infoHmr('Checking for updates on the server...');
        check();
      } else if (['abort', 'fail'].indexOf(status) >= 0) {
        log.warnHmr(
          'Cannot apply update as a previous update ' +
            status +
            'ed. Need to do a full reload!',
        );
      }
    }
  });
  log.infoHmr('Waiting for update signal from WDS...');
} else {
  log.errorHmr('Hot Module Replacement is disabled.');
}
