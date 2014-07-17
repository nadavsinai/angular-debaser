/**
 * @file Defines functions/variables available on the `window` object.
 * @author Christopher Hiller <chiller@decipherinc.com>
 * @license MIT
 * @copyright Copyright &copy; 2014 Decipher, Inc.
 */

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
 * @description Private functions to assist in setting up angular-debaser in a global context.
 * @namespace globalHelpers
 * @private
 * @type {{install: install, hasCurrentSpec: hasCurrentSpec, DEFAULT_OPTS: {debugEnabled: boolean, autoScope: boolean, skipConfigs: boolean, defaultName: string}}}
 */
var globalHelpers = {

  /**
   * @description
   * Attaches {@link debaser} and {@link debase} to the `window` object.
   * Registers `setup()`/`teardown()` or `beforeEach()`/`afterEach()` functions to retrieve the current spec.
   */
  install: function install() {

    window.debaser = debaser;
    window.debase = debase;

    // TODO document these
    (window.beforeEach || window.setup)(function () {
      debaser.$$currentSpec = this;
    });

    (window.afterEach || window.teardown)(function () {
      delete debaser.$$currentSpec;
    });

  },

  /**
   * @description Whether or not we are currently running in a spec.
   * @returns {boolean}
   */
  hasCurrentSpec: function hasCurrentSpec() {
    return !!debaser.$$currentSpec;
  },

  /**
   * @description Default options
   * @typedef {Object} DebaserOptions
   * @property {boolean} [debugEnabled=false] Enable debug log messages?
   * @property {boolean} [autoScope=true] Enable auto-scope functionality when using {@link ng.$controller}?
   * @property {boolean} [skipConfigs=true] Enable stubbing of `config()` blocks?
   * @property {String} [defaultName=__default__] Default name of default Debaser instance; useless
   * @global
   */
  DEFAULT_OPTS: {
    debugEnabled: false,
    autoScope: true,
    skipConfigs: true,
    defaultName: '__default__'
  }

},
debase,
debaser;


/**
 * @description Provides a {@link Debaser} object with which you can stub dependencies easily.
 * @param {(String|Object)} [name=DebaserOptions.name] Optional name of Debaser.  Only useful if using
 * multiple instances.  If omitted, this is considered the `opts` parameter.
 * @param {DebaserOptions} [options={}] Options to modify angular-debaser's behavior; see {@link DebaserOptions}.
 * @function
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
debaser = function debaser(name, options) {
  var debaserSetup,
      defaultName = globalHelpers.DEFAULT_OPTS.defaultName,
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
  angular.mock.module(debaserSetup, 'decipher.debaser');

  // if we are not given a name and the default instance exists, return it so we don't re-instantiate.
  // eliminate debaser._globalInstance TODO why?
  if (!name && hasInstance(defaultName)) {
    debaser._globalInstance = null;
    return getInstance(defaultName);
  }

  // injector to retrieve Debaser class.
  injector = angular.injector(['ng', debaserSetup, 'decipher.debaser']);
  //noinspection JSUnusedAssignment
  Debaser = injector.get('decipher.debaser.debaser');

  // init new Debaser instance or get existing if given name.  eliminate debaser._globalInstance
  // since it's no longer applicable.
  if (name) {
    if (!hasInstance(name)) {
      debaser._debasers[name] = new Debaser(name);
    }
    debaser._globalInstance = null;
    return getInstance(name);
  }

  // (this is a new Debaser with the default name)
  instance = new Debaser();

  // if we're not in a beforeEach() then we're not in a spec.  call this the global, default instance.
  debaser._globalInstance = !globalHelpers.hasCurrentSpec() ? instance : null;

  return instance;
};

/**
 * @description Provides an anonymous AngularJS module to set up some initial values before {@link module:decipher.debaser} is bootstrapped.
 * @param {DebaserOptions} [options] Override {@link DebaserOptions} with this object.
 * @global
 * @private
 * @memberof! debaser
 * @returns {debaser~debaserSetup}
 */
debaser._configure = function _configure(options) {
  var runConfig = debaser._runConfig;

  /**
   * @description
   * Provides two constants, `decipher.debaser.options`, which is set to a {@link DebaserOptions}
   * object when calling {@link debaser}; and `decipher.debaser._runConfig` which is internal data
   * to be used when calling {@link debase} or {@link Debaser#debase}.
   * @param {auto.$provide} $provide {@link https://code.angularjs.org/1.2.20/docs/api/auto/service/$provide.html|auto.$provide docs}
   * @property {Annotation} $inject
   * @memberof! debaser~
   * @private
   * @function debaser~debaserSetup
   * @global
   */
  var debaserSetup = function debaserSetup($provide) {
    $provide.constant('decipher.debaser.options',
      angular.extend({}, globalHelpers.DEFAULT_OPTS, options));
    $provide.constant('decipher.debaser.runConfig', debaser._runConfig);
  };
  debaserSetup.$inject = ['$provide'];
  return debaserSetup;
};

/**
 * @description Retrieve an existing Debaser instance by name.
 * @param {String} name Name of instance
 * @global
 * @memberof! debaser
 * @returns {Debaser}
 * @protected
 */
debaser.getInstance = function getInstance(name) {
  return debaser._debasers[name];
};

/**
 * @description Whether or not an instance with name exists.
 * @param name
 * @global
 * @memberof! debaser
 * @returns {boolean}
 * @protected
 */
debaser.hasInstance = function hasInstance(name) {
  return !!debaser.getInstance(name);
};

/**
 * @description Mapping of {@link Debaser#name}s to {@link Debaser} instances, for potential retrieval later.
 * @private
 * @global
 * @memberof! debaser
 * @type {Object.<String,Debaser>}
 */
debaser._debasers = {};

/**
 * @description Run configurations.  Mapping of {@link Config#_id} to {@link Config} objects.
 * @global
 * @private
 * @memberof! debaser
 * @type {Object.<String,Config>}
 */
debaser._runConfig = {};

/**
 * @description Default instance if we are not running in a spec; presumably created in a `before()` block.
 * @type {?Debaser}
 * @global
 * @memberof! debaser
 * @private
 */
debaser._globalInstance = null;

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
 * @returns {(globalHelpers~callDebase|Debaser)}
 * @param {String} [name] Name of {@link Debaser} instance to call {@link Debaser#debase} upon.
 * @global
 * @public
 */
debase = function debase(name) {
  var defaultName = globalHelpers.DEFAULT_OPTS.defaultName,

      /**
       * @description Calls {@link Debaser#debase} with proper persistance options.  Unlike {@link Debaser#debase}, will return a {@link Debaser} instance.
       * @memberof globalHelpers
       * @function globalHelpers~callDebase
       * @returns {Debaser}
       * @throws Invalid {@link Debaser} name
       * @throws If {@link debaser} was never called
       */
      callDebase = function callDebase() {
        var d,
            hasInstance = debaser.hasInstance,
            globalInstance = debaser._globalInstance;

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

  return globalHelpers.hasCurrentSpec() ? callDebase() : callDebase;
};

globalHelpers.install();
