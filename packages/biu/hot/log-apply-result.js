/**
 * /*
 * 	MIT License http://www.opensource.org/licenses/mit-license.php
 * 	Author Tobias Koppers @sokra
 *
 * @format
 */

module.exports = function (updatedModules, renewedModules) {
  var unacceptedModules = updatedModules.filter(function (moduleId) {
    return renewedModules && renewedModules.indexOf(moduleId) < 0;
  });
  var log = require('./log');

  if (unacceptedModules.length > 0) {
    log.warnHmr(
      "The following modules couldn't be hot updated: (They would need a full reload!)",
    );
    unacceptedModules.forEach(function (moduleId) {
      log.warnHmr(moduleId);
    });
  }

  if (!renewedModules || renewedModules.length === 0) {
    log.eventHmr('Nothing hot updated.');
  } else {
    log.eventHmr('Updated modules:');
    renewedModules.forEach(function (moduleId) {
      if (typeof moduleId === 'string' && moduleId.indexOf('!') !== -1) {
        var parts = moduleId.split('!');
        log.eventGroupHmr(parts.pop());
        log.eventHmr(moduleId);
        log.groupEnd();
      } else {
        log.eventHmr(moduleId);
      }
    });
    var numberIds = renewedModules.every(function (moduleId) {
      return typeof moduleId === 'number';
    });
    if (numberIds)
      log.infoHmr(
        'Consider using the optimization.moduleIds: "named" for module names.',
      );
  }
};
