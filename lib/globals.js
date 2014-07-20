'use strict';

/**
 * @typedef {Array.<String>} Annotation
 * @private
 * @description Annotation for AngularJS factories.
 */

/**
 * @external angular
 * @see {@link http://angularjs.org}
 */

/**
 * @namespace {function} window.debaser
 * @see {@link debaser}
 */

/**
 * @description Default options
 * @typedef {object} DebaserOptions
 * @property {boolean} [debugEnabled=false] Enable debug log messages?
 * @property {boolean} [autoScope=true] Enable auto-scope functionality when using {@link ng.$controller}?
 * @property {boolean} [skipConfigs=true] Enable stubbing of `config()` blocks?
 * @property {string} [defaultName=__default__] Default name of default Debaser instance; useless
 * @global
 */
var DEFAULT_OPTS = {
  debugEnabled: false,
  autoScope: true,
  skipConfigs: true,
  defaultName: '__default__'
};

/**
 * Attaches {@link debaser} and {@link debase} to the `window` object.
 * Registers `setup()`/`teardown()` or `beforeEach()`/`afterEach()` functions to retrieve the current spec.
 */
var install = function install() {

  window.debaser = debaser;
  window.debase = debase;

  // TODO document these
  (window.beforeEach || window.setup)(function () {
    debaser.$$currentSpec = this;
  });

  (window.afterEach || window.teardown)(function () {
    delete debaser.$$currentSpec;
  });

  debaser.bootstrap(runConfig);
};

/**
 * @description Whether or not we are currently running in a spec.
 * @returns {boolean}
 */
var hasCurrentSpec = function hasCurrentSpec() {
  return !!debaser.$$currentSpec;
};

/**
 * @description Provides a {@link Debaser} object with which you can stub dependencies easily.
 * @param {(String|Object)} [name=DebaserOptions.name] Optional name of Debaser.  Only useful if using
 * multiple instances.  If omitted, this is considered the `opts` parameter.
 * @param {DebaserOptions} [options={}] Options to modify angular-debaser's behavior; see {@link DebaserOptions}.
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
 * @global
 * @public
 */
var debaser = function debaser(name, options) {
  var debaserSetup,
    defaultName = DEFAULT_OPTS.defaultName,
    getInstance = debaser.getInstance,
    hasInstance = debaser.hasInstance,
    injector,
    instance,
    opts,
    Debaser;

  // setup args
  if (angular.isObject(name)) {
    opts = name;
    name = null;
  } else {
    opts = options;
  }

  opts = opts || {};
  debaserSetup = debaser._configure(opts);

  // bootstrap the debaserSetup and decipher.debaser module, so we can get to the debaserFactory.
  angular.mock.module(debaserSetup, 'decipherDebaser');

  // if we are not given a name and the default instance exists, return it so we don't re-instantiate.
  // eliminate debaser.__globalInstance TODO why?
  if (!name && hasInstance(defaultName)) {
    debaser.__globalInstance = null;
    return getInstance(defaultName);
  }

  // injector to retrieve Debaser class.
  injector = angular.injector(['ng', debaserSetup, 'decipherDebaser']);
  //noinspection JSUnusedAssignment
  Debaser = injector.get('debaserDebaser');

  // init new Debaser instance or get existing if given name.  eliminate debaser.__globalInstance
  // since it's no longer applicable.
  if (name) {
    if (!hasInstance(name)) {
      debaser.__debasers[name] = new Debaser(name);
    }
    debaser.__globalInstance = null;
    return getInstance(name);
  }

  // (this is a new Debaser with the default name)
  instance = new Debaser();

  // if we're not in a beforeEach() then we're not in a spec.  call this the global, default instance.
  debaser.__globalInstance = !hasCurrentSpec() ? instance : null;

  return instance;
};

/**
 * @description Provides an anonymous AngularJS module to set up some initial values before {@link module:decipher.debaser} is bootstrapped.
 * @param {DebaserOptions} [options] Override {@link DebaserOptions} with this object.
 * @returns {function}
 */
var configure = function configure(options) {
  /**
   * @description
   * Provides two constants, `debaserOptions`, which is set to a {@link DebaserOptions}
   * object when calling {@link debaser}; and `decipher.debaser.__runConfig` which is internal data
   * to be used when calling {@link debase} or {@link Debaser#debase}.
   * @param {auto.$provide} $provide {@link https://code.angularjs.org/1.2.20/docs/api/auto/service/$provide.html|auto.$provide docs}
   * @property {Annotation} $inject
   */
  var debaserSetup = function debaserSetup($provide) {
    $provide.constant('debaserOptions',
      angular.extend({}, DEFAULT_OPTS, options));
    $provide.constant('debaserRunConfig', runConfig);
  };
  debaserSetup.$inject = ['$provide'];
  return debaserSetup;
};

/**
 * @description Retrieve an existing Debaser instance by name.
 * @param {string} name Name of instance
 * @returns {Debaser}
 */
var getInstance = function getInstance(name) {
  return debasers[name];
};

/**
 * @description Whether or not an instance with name exists.
 * @param {string} name Name of instance
 * @returns {boolean}
 */
var hasInstance = function hasInstance(name) {
  return !!getInstance(name);
};

/**
 * @description Mapping of {@link Debaser#name}s to {@link Debaser} instances, for potential retrieval later.  **Exposed for unit testing.**
 * @type {Object.<String,Debaser>}
 * @private
 * @memberof window.debaser
 */
var debasers = debaser.__debasers = {};

/**
 * @description Run configurations.  Mapping of {@link Config#_id} to {@link Config} objects. **Exposed for unit testing**
 * @todo test
 * @type {Object.<String,Config>}
 * @memberof window.debaser
 * @private
*/
var runConfig = debaser.__runConfig = {};

/**
 * @description Default instance if we are not running in a spec; presumably created in a `before()` block.  **Exposed for unit testing**
 * @type {?Debaser}
 * @todo test
 * @memberof window.debaser
 * @private
 */
var globalInstance = debaser.__globalInstance = null;

/**
 * @description Convenience method.  Retrieves the default instance (whatever that may be) and runs `debase()` on it.
 * @example
 *
 * before(function() {
 *   debaser()
 *     .func('foo')
 *     .object('bar')
 * });
 *
 * beforeEach(debase);
 *
 * // above equivalent to:
 *
 * var d;
 * before(function() {
 *   d = debaser()
 *     .func('foo')
 *     .object('bar')
 * });
 *
 * beforeEach(function() {
 *   d.debase();
 * });
 * @returns {(function|Debaser)}
 * @param {string} [name] Name of {@link Debaser} instance to call {@link Debaser#debase} upon.
 * @memberof window.debaser
 * @public
 */
var debase = function debase(name) {
  var defaultName = DEFAULT_OPTS.defaultName,

    /**
     * @description Calls {@link Debaser#debase} with proper persistance options.  Unlike {@link Debaser#debase}, will return a {@link Debaser} instance.
     * @memberof globalHelpers
     * @function callDebase
     * @returns {Debaser}
     * @throws Invalid {@link Debaser} name
     * @throws If {@link debaser} was never called
     */
    callDebase = function callDebase() {
      var d;

      if (!name || !angular.isString(name)) {
        if (!hasInstance(defaultName)) {
          if (globalInstance) {
            return globalInstance.debase({persist: true});
          }
          throw new Error('debaser: no Debaser initialized!');
        }
        name = defaultName;
      }
      else if (!hasInstance(name)) {
        throw new Error('debaser: cannot find Debaser instance with name "' + name + '"');
      }
      d = debaser.getInstance(name);
      // TODO not sure if persist value is correct.
      d.debase({
        persist: name !== defaultName
      });
      return d;
    };

  return hasCurrentSpec() ? callDebase() : callDebase;
};

install();
