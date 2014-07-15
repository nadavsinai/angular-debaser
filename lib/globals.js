'use strict';

var DEFAULT_OPTS = {
  debugEnabled: false,
  autoScope: true,
  skipConfigs: true,
  _default_name: '__default__'
};

var setup = function setup(options) {
  var _setup = function _setup($provide) {
    $provide.constant('decipher.debaser.options',
      angular.extend({}, DEFAULT_OPTS, options));
    $provide.constant('decipher.debaser.runConfig', window.debaser.$$config);
  };
  _setup.$inject = ['$provide'];
  return _setup;
};

var hasCurrentSpec = function hasCurrentSpec() {
  return !!debaser.$$currentSpec;
};

/**
 * @description Provides a {@link Debaser} object with which you can stub dependencies easily.
 * @param {String|Object} [name=__default__] Optional name of Debaser.  Only useful if using
 * multiple instances.  If omitted, this is considered the `opts` parameter.
 * @param {Object} [opts] Options to modify angular-debaser's behavior.
 * @param {Boolean} [opts.debugEnabled=false] Whether or not to show debug output.
 * @param {Boolean} [opts.autoScope=true] Whether or not to provide Scope objects automatically to
 * the $controller service.
 * @param {Boolean} [opts.skipConfigs=true] Whether or not to skip `config()` blocks when loading
 * existing modules.
 * @example
 *
 * // Defaults
 * var d = debaser({
 *  debugEnabled: false,
 *  autoScope: true
 *  skipConfigs: true
 * });
 *
 * // Named
 * var d = debaser('foo', {
 *  debugEnabled: false,
 *  autoScope: true
 *  skipConfigs: true
 * });
 *
 * @returns {Debaser}
 */
var debaser = function debaser(name, opts) {
  var Debaser,
      default_name = DEFAULT_OPTS._default_name,
      instance,
      injector,
      getInstance = debaser.getInstance,
      hasInstance = debaser.hasInstance,
      setupFn;

  if (angular.isObject(name)) {
    opts = name;
    name = null;
  }

  opts = opts || {};
  setupFn = setup(opts);
  angular.mock.module(setupFn, 'decipher.debaser');

  if (!name && hasInstance(default_name)) {
    delete debaser.$$globalInstance;
    return getInstance(default_name);
  }

  injector = angular.injector(['ng', setupFn, 'decipher.debaser']);
  //noinspection JSUnusedAssignment
  Debaser = injector.get('decipher.debaser.debaser');

  if (name) {
    if (!hasInstance(name)) {
      debaser.$$debasers[name] = new Debaser(name);
    }
    delete debaser.$$globalInstance;
    return getInstance(name);
  }
  instance = new Debaser();
  if (!hasCurrentSpec()) {
    debaser.$$globalInstance = instance;
  } else {
    delete debaser.$$globalInstance;
  }
  return instance;
};

debaser.getInstance = function getInstance(name) {
  return debaser.$$debasers[name];
};
debaser.hasInstance = function hasInstance(name) {
  return !!debaser.getInstance(name);
};

debaser.$$debasers = {};
debaser.$$config = {};

// shamelessly lifted from angular-mocks
(window.beforeEach || window.setup)(function () {
  debaser.$$currentSpec = this;
});

(window.afterEach || window.teardown)(function () {
  delete debaser.$$currentSpec;
});

var debase = function debase() {
  var default_name = DEFAULT_OPTS._default_name,
      name = arguments[0],
      callDebase = function callDebase() {
        if (!name || !angular.isString(name)) {
          if (!debaser.hasInstance(default_name)) {
            if (debaser.$$globalInstance) {
              return debaser.$$globalInstance.debase({persist: true});
            }
            throw new Error('debaser: no Debaser initialized!');
          }
          name = default_name;
        }
        else if (!debaser.hasInstance(name)) {
          throw new Error('debaser: cannot find Debaser instance with name "' + name + '"');
        }
        // @todo not sure if persist value is correct.
        debaser.getInstance(name).debase({persist: name !== default_name});
      };

  return hasCurrentSpec() ? callDebase() : callDebase;
};
debaser.debase = debase;

window.debaser = debaser;
window.debase = debase;

