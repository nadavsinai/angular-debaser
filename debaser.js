/*! angular-debaser - v0.2.3 - 2014-07-11
* https://github.com/decipherinc/angular-debaser
* Copyright (c) 2014 Decipher, Inc.; Licensed MIT */

(function (window, angular) {
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


angular.module('decipher.debaser', [])

  /**
   * @name decipher.debaser.runConfig
   * @memberof decipher.debaser
   * @type Object
   */
    .constant('decipher.debaser.runConfig', window.debaser.$$config)
    .config(['decipher.debaser.options', '$logProvider', '$provide',
      function config(options, $logProvider, $provide) {
        // older versions of angular-mocks do not implement this function.
        if (angular.isFunction($logProvider.debugEnabled)) {
          $logProvider.debugEnabled(options.debugEnabled);
        }
        // likewise, maybe no debug() either
        $provide.decorator('$log', ['$delegate', function ($delegate) {
          $delegate.debug = $delegate.debug || options.debugEnabled ? $delegate.log : angular.noop;
          return $delegate;
        }]);
      }
    ]);


  angular.module('decipher.debaser')
    .factory('decipher.debaser.loadAction', function loadActionFactory() {

      var Action = function Action(action) {
        angular.extend(this, action);
      };

      Action.prototype.deserialize = function deserialize() {
        return function action() {
          this.callback(this.object[this.func].apply(this.context,
            this.args));
        }.bind(this);
      };

      return function loadAction(cfg) {
        return cfg.actions.map(function (action) {
          return new Action(action);
        });
      };
    });


  angular.module('decipher.debaser').factory('decipher.debaser.aspect',
    ['decipher.debaser.superpowers', 'decipher.debaser.behavior',
      function aspectFactory(superpowers, Behavior) {

        var Aspect = function Aspect(name, parent) {
          this.name = name;
          this.parent = parent;
          this._id = Aspect._id++;
        };

        Aspect._id = 0;

        Aspect._DEFAULT_NAME = 'base';

        Object.defineProperties(Aspect.prototype, {
          name: {
            get: function getName() {
              return this._name;
            },
            set: function setName(name) {
              this._dirty = this._isDirty(name, '_name');
              this._name = name || Aspect._DEFAULT_NAME;
            }
          },
          parent: {
            get: function getParent() {
              return this._parent;
            },
            set: function setParent(parent) {
              this._dirty = this._isDirty(parent, '_parent');
              this._parent = parent;
            }
          },
          proto: {
            get: function getProto() {
              var dirty = this._dirty;
              if (!this._proto || dirty) {
                this._initProto();
              }
              this._dirty = false;
              return this._proto;
            },
            set: function setProto(proto) {
              this._proto = proto;
            }
          },
          behavior: {
            get: function getBehavior() {
              var dirty = this._dirty;
              if (!this._behavior || dirty) {
                this._initBehavior();
              }
              this._dirty = false;
              return this._behavior;
            },
            set: function setBehavior(behavior) {
              this._behavior = behavior;
            }
          },
          config: {
            get: function getConfig() {
              return this.behavior.config;
            },
            set: function setConfig(config) {
              this.behavior.config = config;
            }
          }
        });

        Aspect.prototype._initProto = function _initProto() {
          var o;
          if (this._proto && !this._dirty) {
            return;
          }
          o = {};
          if (this.parent) {
            angular.extend(o, this.parent.proto);
          }
          angular.forEach(superpowers, function (fn, name) {
            if (name.charAt(0) !== '$' &&
              fn.$aspect.indexOf(this._name) !== -1) {
              o[name] = this.createProxy(fn, name);
            }
          }, this);
          this._proto = o;
        };

        Aspect.prototype._initBehavior = function _initBehavior() {
          if (this._behavior && !this._dirty) {
            return;
          }
          this._behavior = new Behavior(angular.extend(this._behavior || {},
              this.parent && this.parent.isAspectOf(this.name) &&
              this.parent.behavior), this.name);
        };

        Aspect.prototype.flush = function flush() {
          return this.behavior.flush();
        };

        Aspect.prototype._isDirty = function _isDirty(value, prop) {
          return (value && value !== this[prop]) || (!value && this[prop]);
        };

        Aspect.prototype.createProxy = function createProxy(fn, name) {
          var proxy;
          /**
           * @this Debaser
           * @returns {Debaser|*}
           * @todo trim fat
           */
          proxy = function proxy() {
            var current_aspect = this.$$aspect,
                inherits = current_aspect.isAspectOf(name),
                retval = this,
                aspect,
                result;

            if (!inherits && current_aspect.name !== 'base') {
              this.$enqueue();
            }
            aspect = this.$aspect(fn.$name || name);
            result = fn.apply(aspect.config, arguments);

            if (angular.isArray(result)) {
              aspect.behavior.enqueue(result);
            }
            else if (result) {
              retval = result;
            }
            return retval;
          };
          return proxy;
        };
        Aspect.prototype.createProxy.cache = {};

        Aspect.prototype.isAspectOf = function isAspectOf(name) {
          return name !== 'base' && superpowers[name] &&
            superpowers[name].$aspect.indexOf(this.name) !== -1;
        };

        return Aspect;
      }
    ]);

  angular.module('decipher.debaser').factory('decipher.debaser.behavior',
    ['decipher.debaser.config', function $behaviorFactory(Config) {
      var Behavior = function Behavior(o, aspect_name) {
        angular.extend(this, o);
        this._aspect_name = aspect_name;
        this._id = Behavior._id++;
      };

      Behavior._id = 0;

      Behavior.prototype.enqueue = function enqueue(calls) {
        this.queue.push.apply(this.queue, calls);
      };

      Behavior.prototype.flush = function flush() {
        return this.queue.map(function (action) {
          return action.deserialize();
        });
      };

      Object.defineProperties(Behavior.prototype, {
        queue: {
          get: function getQueue() {
            if (!this._queue) {
              this._queue = [];
            }
            return this._queue;
          },
          set: function setQueue(queue) {
            this._queue = queue || [];
          }
        },
        config: {
          get: function getConfig() {
            if (!this._config) {
              this._config = new Config(this._aspect_name);
            }
            return this._config;
          },
          set: function setConfig(config) {
            this._config = config || new Config(this._aspect_name);
          }
        }
      });

      return Behavior;
    }]);

  angular.module('decipher.debaser').factory('decipher.debaser.config',
    function configFactory() {

      /**
       * @name Config
       * @param o
       * @constructor
       * @param aspect_name
       */
      var Config = function Config(o, aspect_name) {
        if (angular.isString(o)) {
          aspect_name = o;
        }
        else {
          angular.extend(this, o);
        }
        this._aspect_name = aspect_name;
        this._callbacks = [];
        this._cb_idx = 0;
        this._id = Config._id++;
        this.actions = this.actions || [];
      };

      Config._id = 0;

      Config.prototype.addAction = function addAction(opts) {
        if (!opts) {
          throw new Error('$debaser: addCall() expects call options');
        }
        opts.callback = opts.callback || this.runner();
        opts.context =
          angular.isDefined(opts.context) ? opts.context : opts.object || null;
        this.actions.push(opts);
      };

      Config.prototype.next = function next() {
        if (this._callbacks[this._cb_idx]) {
          this._callbacks[this._cb_idx++].apply(this, arguments);
        } else {
          this.done();
        }
      };

      Config.prototype.done = function done() {
        this._cb_idx = 0;
      };

      Config.prototype.chain = function chain(fn) {
        this._callbacks.push(function debaserCallbackProxy() {
          this.next(fn.apply(this, arguments));
        }.bind(this));
      };

      Config.prototype.runner = function runner() {
        return function run() {
          this.next.apply(this, arguments);
        }.bind(this);
      };

      Config.prototype.isChained = function isChained() {
        return !!this._callbacks.length;
      };

      return Config;

    });

  angular.module('decipher.debaser').factory('decipher.debaser.debaser',
    ['$log', 'decipher.debaser.aspect', 'decipher.debaser.options',
      function $debaserFactory($log, Aspect, options) {

        /**
         * @name Debaser
         * @param name
         * @constructor
         */
        var Debaser = function Debaser(name) {
          if (!angular.isString(name)) {
            name = Debaser.DEFAULT_NAME;
          }
          this.$name = name;
          this.$queue = [];
          this.$aspect('base');
          if (name !== Debaser.DEFAULT_NAME) {
            $log.debug('$debaser: created Debaser instance with name "' + name + '"');
          } else {
            $log.debug('$debaser: created singleton Debaser instance');
          }
        };

        Debaser.DEFAULT_NAME = '__default__';

        Debaser.prototype.$config = function $config() {
          return this.$$aspect.config;
        };

        Debaser.prototype.$aspect = function $aspect(name) {
          var current_aspect = this.$$aspect,
              aspect,
              proto;
          if (angular.isUndefined(name)) {
            name = current_aspect.name;
          }
          if (current_aspect) {
            proto = current_aspect.proto;
            Object.keys(proto).forEach(function (name) {
              delete this[name];
            }, this);
          }
          aspect = new Aspect(name, current_aspect);
          angular.extend(this, aspect.proto);
          this.$$aspect = aspect;
          return aspect;
        };

        Debaser.prototype.$enqueue = function $enqueue() {
          var current_aspect = this.$$aspect;
          if (current_aspect) {
            this.$queue.push.apply(this.$queue, current_aspect.flush());
          }
        };

        Debaser.autoScopeProvider = function ($provide) {
          $provide.decorator('$controller',
            ['$rootScope', '$delegate', function ($rootScope, $delegate) {
              return function (name, locals) {
                locals = locals || {};
                if (!locals.$scope) {
                  locals.$scope = $rootScope.$new();
                }
                $delegate(name, locals);
                return locals.$scope;
              };
            }]);
        };
        Debaser.autoScopeProvider.$inject = ['$provide'];

        Debaser.prototype.debase = function debase() {
          this.$enqueue();
          this.$queue.forEach(function (fn) {
            fn();
          });
          this.$queue = [];
          this.$aspect('base');
          if (options.autoScope) {
            angular.mock.module(Debaser.autoScopeProvider);
          }
        };

        return Debaser;
      }]);


angular.module('decipher.debaser').factory('decipher.debaser.superpowers',
    ['decipher.debaser.loadAction', '$window', 'decipher.debaser.runConfig', '$log',
      'decipher.debaser.options',
      function superpowersFactory(loadAction, $window, $runConfig, $log, options) {

        var sinon = $window.sinon,
            SINON_EXCLUDE = [
              'create',
              'resetBehavior',
              'isPresent'
            ],

            // better way to do this?
            isSinon = function isSinon(value) {
              return value.displayName === 'stub' ||
                value.displayName === 'spy';
            },

            debaserConstantCallback = function debaserConstantCallback(module) {
              if (this.name && this.stub && module && module.constant) {
                return module.constant(this.name, this.stub);
              }
            },

            module,
            withDep,
            withDeps,
            func,
            object,
            withFunc,
            withObject;

        module = function module(name, deps) {
          var real_module, i;
          if (!name) {
            name = 'dummy-' + module.$id++;
          }
          if (!angular.isString(name)) {
            throw new Error('$debaser: module() expects a string');
          }
          this.module = name;
          this.module_dependencies = [];
          if (deps) {
            if (!angular.isArray(deps)) {
              throw new Error('$debaser: module() expects array or undefined as second parameter');
            }
            superpowers.withDeps.call(this, deps);
          }
          try {
            real_module = angular.module(name);
            if (options.skipConfigs && real_module) {
              i = real_module._invokeQueue.length;
              while (i--) {
                if (real_module._invokeQueue[i][0] === '$injector' &&
                  real_module._invokeQueue[i][1] === 'invoke') {
                  real_module._invokeQueue.splice(i, 1);
                }
              }
            }
          }
          catch (e) {
          }
          this.addAction({
            object: angular,
            func: 'module',
            args: !real_module ? [this.module, this.module_dependencies] : [this.module]
          });
          this.addAction({
            object: angular.mock,
            func: 'module',
            args: [this.module]
          });
          return loadAction(this);
        };
        module.$aspect = ['base'];
        module.$id = 0;

        withDep = function withDep() {
          if (!arguments.length) {
            return $log.debug('$debaser: ignoring empty call to withDep()');
          }
          Array.prototype.slice.call(arguments).forEach(function (arg) {
            if (!angular.isString(arg)) {
              throw new Error('$debaser: withDep() expects one or more strings');
            }
          });
          this.module_dependencies.push.apply(this.module_dependencies,
            arguments);
        };
        withDep.$aspect = ['module'];

        withDeps = function withDeps(arr) {
          if (!arr) {
            return $log.debug('$debaser: ignoring empty call to withDeps()');
          }
          if (!angular.isArray(arr)) {
            throw new Error('$debaser: withDeps() expects an array');
          }
          withDep.apply(this, arr);
        };
        withDeps.$aspect = ['module'];

        func = function func(name) {
          var args = Array.prototype.slice.call(arguments, 1);
          if (!name) {
            return $log.debug('$debaser: ignoring empty call to func()');
          }
          if (!angular.isString(name)) {
            throw new Error('$debaser: func() expects a name');
          }
          this.func = sinon && sinon.stub ? sinon.stub.apply(sinon, args) :
            function debaserStub() {
            };
          return object.call(this, name, this.func);
        };
        func.$aspect = ['base'];

        object = function object(name, base) {
          if (!name) {
            return $log.debug('$debaser: ignoring empty call to object()');
          }
          if (!angular.isString(name)) {
            throw new Error('$debaser: object() expects a name');
          }
          if (base && !angular.isFunction(base) && !angular.isObject(base)) {
            throw new Error('$debaser: object() second param should be an ' +
              'Object or undefined');
          }
          if (!this.stub) {
            if (!angular.isObject(base) && !angular.isFunction(base)) {
              base = {};
            }
            if (angular.isObject(base)) {
              this.stub =
                  sinon && sinon.stub && !isSinon(base) ? sinon.stub(base) :
                base;
            } else {
              this.stub = base;
            }
          }
          if (!this.isChained()) {
            this.name = name;
            this.component = 'value';
            this.provider = function provider($provide, $config) {
              var cfg = $config[provider._id];
              $provide[cfg.component](cfg.name, cfg.stub);
            };
            // angularjs hates to inject identical functions.
            // this makes them no longer identical.
            this.provider.toString = function toString() {
              return 'debaserProvider-' + this._id.toString();
            }.bind(this);
            this.provider._id = this._id;
            this.provider.$inject = ['$provide', 'decipher.debaser.runConfig'];
            this.addAction(
              {
                object: angular.mock,
                func: 'module',
                args: [this.provider]
              }
            );
            $runConfig[this._id] = this;
            return loadAction(this);
          }
        };
        object.$aspect = ['base'];

        // todo: add warnings here
        withFunc = function withFunc(name) {
          var args = Array.prototype.slice.call(arguments, 1);
          if (angular.isObject(this.stub)) {
            this.func = sinon && sinon.stub ? sinon.stub.apply(sinon, args) :
              function debaserStub() {
              };
            this.stub[name] = this.func;
          } else {
            this.name = name;
            this.chain(debaserConstantCallback.bind(this));
            func.apply(this, arguments);
          }
        };
        withFunc.$aspect = ['module', 'object', 'withObject'];

        withObject = function withObject(name) {
          this.name = name;
          this.chain(debaserConstantCallback.bind(this));
          object.apply(this, arguments);
        };
        withObject.$aspect = ['module'];

        var superpowers = {
          func: func,
          module: module,
          object: object,
          withDep: withDep,
          withDeps: withDeps,
          withFunc: withFunc,
          withObject: withObject,

          // exposed for testing
          $SINON_EXCLUDE: SINON_EXCLUDE
        };

        angular.forEach(superpowers, function (fn, name) {
          if (!fn.$name) {
            fn.$name = name;
          }
        });

        if (sinon) {
          angular.forEach(sinon.stub, function (fn, name) {
            if (angular.isFunction(fn) && SINON_EXCLUDE.indexOf(name) === -1) {
              var sinonProxy = function sinonProxy() {
                var retval = fn.apply(this.func, arguments);
                if (retval && retval.stub && retval.stub.func) {
                  retval.end = function debaserEnd() {
                    return this;
                  }.bind(this);
                  return retval;
                }
              };
              sinonProxy.$aspect = ['func', 'withFunc'];
              superpowers[name] = sinonProxy;
            }
          });
        }

        return superpowers;
      }]);
})(window, window.angular);