'use strict';

var DEFAULTS = {
  debugEnabled: false,
  autoScope: true,
  skipConfigs: true
};

var setup = function setup(options) {
  var _setup = function _setup($provide) {
    $provide.constant('decipher.debaser.options',
      angular.extend({}, DEFAULTS, options));
    $provide.constant('decipher.debaser.runConfig', window.debaser.$$config);
  };
  _setup.$inject = ['$provide'];
  return _setup;
};

var debaser = function debaser(name, opts) {
  var Debaser,
      instance,
      debasers = window.debaser.$$debasers,
      injector,
      setupFn;

  if (angular.isObject(name)) {
    opts = name;
    name = null;
  }

  opts = opts || {};
  setupFn = setup(opts);
  angular.mock.module(setupFn, 'decipher.debaser');

  if (!name && debasers.__default__) {
    return debasers.__default__;
  }

  injector = angular.injector(['ng', setupFn, 'decipher.debaser']);
  Debaser = injector.get('decipher.debaser.debaser');

  if (name) {
    if (!debasers[name]) {
      debasers[name] = new Debaser(name);
    }
    return debasers[name];
  }
  debasers.__default__ = instance = new Debaser();
  window.debase = instance.debase.bind(instance);
  return instance;
};
debaser.$$debasers = {};
debaser.$$config = {};

window.debaser = debaser;

