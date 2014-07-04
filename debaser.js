/*! angular-debaser - v0.1.0 - 2014-07-04
* https://github.com/decipherinc/angular-debaser
* Copyright (c) 2014 Decipher, Inc.; Licensed MIT */
(function (window, angular) {
  'use strict';

  var DEFAULTS = {
    debugEnabled: false
  };

  angular.module('decipher.debaser', [])
    .config(['decipher.debaser.options', '$logProvider', '$provide',
      function config(options, $logProvider, $provide) {
        // older versions of angular-mocks do not implement this function.
        if (angular.isFunction($logProvider.debugEnabled)) {
          $logProvider.debugEnabled(options.debugEnabled);
        }
        $provide.decorator('$log', ['$delegate', function ($delegate) {
          // likewise, maybe no debug() either
          return $delegate.debug || angular.noop;
        }]);
      }
    ])
    .factory('$debaser',
    ['$log', '$aspect', function $debaserFactory($log, Aspect) {

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
          $log('$debaser: created Debaser instance with name "' + name + '"');
        } else {
          $log('$debaser: created singleton Debaser instance');
        }
      };

      Debaser.DEFAULT_NAME = '__default__';

      Debaser.prototype.$$config = function $$config() {
        return this.$$aspect.config;
      };

      Debaser.prototype.$aspect = function $aspect(name) {
        var current_aspect = this.$$aspect,
            aspect,
            proto;
        if (!name) {
          return current_aspect;
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
        if (!current_aspect) {
          return;
        }
//        window.console.warn('enqueueing');
        this.$queue.push.apply(this.$queue, current_aspect.flush());
      };

      Debaser.prototype.debase = function debase() {
        this.$enqueue();
        this.$queue.forEach(function (fn) {
          window.console.log(fn.toString());
          fn();
        });
        this.$queue = [];
        this.$aspect('base');
      };

      return Debaser;
    }]);


  var setup = function setup(options) {
    return function ($provide) {
      $provide.constant('decipher.debaser.options',
        angular.extend({}, DEFAULTS, options));
    };
  };
  setup.$inject = ['$provide'];

  window.debaser = function debaser(name, opts) {
    var Debaser,
        instance,
        debasers = window.debaser.$$debasers,
        injector;
    if (angular.isObject(name)) {
      opts = name;
      name = null;
    }

    if (!name && debasers.__default__) {
      return debasers.__default__;
    }

    opts = opts || {};
    injector = angular.injector(['ng', setup(opts), 'decipher.debaser']);
    Debaser = injector.get('$debaser');

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
  window.debaser.$$debasers = {};

})(window, window.angular);

(function (angular) {
  'use strict';

  angular.module('decipher.debaser').factory('$aspect',
    ['$superpowers', '$behavior',
      function $aspectFactory(superpowers, Behavior) {

        var Aspect = function Aspect(name, parent) {
          this.name = name;
          this.parent = parent;
        };

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
                this._initProto(dirty);
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
                this._initBehavior(dirty);
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

        Aspect.prototype._initProto = function _initProto(force) {
          var o;
          if (this._proto && !force) {
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

        Aspect.prototype._initBehavior = function _initBehavior(force) {
          if (this._behavior && !force) {
            return;
          }

          this._behavior = new Behavior(angular.extend(this._behavior || {},
              this.parent && this.parent.isAspectOf(this.name) &&
              this.parent.behavior));
        };

        Aspect.prototype.flush = function flush() {
          return this.behavior.flush();
        };

        Aspect.prototype.reset = function reset() {
          this.behavior.reset();
        };

        Aspect.prototype._isDirty = function _isDirty(value, prop) {
          return (value && value !== this[prop]) || (!value && this[prop]);
        };

        Aspect.prototype.createProxy = function createProxy(fn, name) {
          var proxy,
              cache = this.createProxy.cache;

          if (cache[name]) {
            return cache[name];
          }
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
                result,
                behavior = current_aspect.behavior;

            if (!inherits && current_aspect.name !== 'base') {
              this.$enqueue();
            }
            aspect = this.$aspect(fn._name || name);
            if (!inherits) {
              behavior = aspect.behavior;
            }
            result = fn.apply(this, arguments);

            if (angular.isArray(result)) {
              behavior.enqueue(result);
            }
            else if (result) {
              retval = result;
            }
            return retval;
          };
          cache[name] = proxy;
          return proxy;
        };
        Aspect.prototype.createProxy.cache = {};

        Aspect.prototype.isAspectOf = function isAspectOf(name) {
          // if we are switching from base to another base, then we do not
          // inherit the parent.
          // otherwise we're switching from a base to a nested aspect,
          // which means we keep the parent.
          // if we're in a function's aspect and the new function is of
          // that aspect, then we inherit from the parent.
          return this.name !== 'base' && name !== 'base' && superpowers[name] &&
            superpowers[name].$aspect.indexOf(this.name) !== -1;
        };

        return Aspect;
      }
    ]);

})(window.angular);

(function (angular) {
  'use strict';

  angular.module('decipher.debaser').factory('$behavior',
    ['$callConfig', function $behaviorFactory(CallConfig) {
      var Behavior = function Behavior(o) {
        angular.extend(this, o);
      };

      Behavior.prototype.enqueue = function enqueue(calls) {
        this.queue.push.apply(this.queue, calls);
      };

      Behavior.prototype.reset = function reset() {
        delete this.queue;
        delete this.config;
      };

      Behavior.prototype.flush = function flush() {
        return this.queue.map(function (call) {
          return call.deserialize();
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
              this._config = new CallConfig();
            }
            return this._config;
          },
          set: function setConfig(config) {
            this._config = config || new CallConfig();
          }
        }
      });

      return Behavior;
    }]);

})(window.angular);

(function(angular) {
  'use strict';

  angular.module('decipher.debaser')
    .factory('$call', function $callFactory() {

      var Call = function Call(cfg, opts) {
        this.$cfg = cfg;
        angular.extend(this, opts);
        this.context = this.context|| this.object || null;
        this.callback = angular.isFunction(this.callback) || cfg.runner();
      };

      Call.prototype.toString = function toString() {
        return JSON.stringify({
          args: this.args,
          callback: this.callback,
          func: this.func,
          $cfg: this.$cfg
        }, null, 2);
      };

      Call.prototype.deserialize = function deserialize() {
        var object = this.object,
            func = this.func,
            context = this.context,
            callback = this.callback,
            args = this.args.map(function (arg) {
              return this.$cfg[arg];
            }, this);

        var debaserCall = function debaserCall() {
          window.console.warn(args);
          callback(object[func].apply(context, args));
        }.bind(this);
        debaserCall.toString = function toString() {
          return JSON.stringify({
            args: args,
            func: func
          }, null, 2);
        };
        return debaserCall;
      };

      return function call(cfg) {
        var calls = Array.prototype.slice.call(arguments, 1);
        return calls.map(function (opts) {
          return new Call(cfg, opts);
        });
      };

    });

})(window.angular);

(function (angular) {

  'use strict';

  angular.module('decipher.debaser').factory('$callConfig',
    function $callConfigFactory() {

      var CallConfig = function CallConfig(o) {
        angular.extend(this, o);
        this.callbacks = this.callbacks || [];
        this.cb_idx = 0;
      };

      CallConfig.prototype.next = function next() {
        if (this.callbacks[this.cb_idx]) {
          this.callbacks[this.cb_idx++].apply(this, arguments);
        } else {
          this.done();
        }
      };

      CallConfig.prototype.done = function done() {
        this.cb_idx = 0;
      };

      CallConfig.prototype.chain = function chain(fn) {
        this.callbacks.push(function debaserCallbackProxy() {
          this.next(fn.apply(this, arguments));
        }.bind(this));
      };

      CallConfig.prototype.runner = function runner() {
        return function run() {
          this.next.apply(this, arguments);
        }.bind(this);
      };

      CallConfig.prototype.isChained = function isChained() {
        return !!this.callbacks.length;
      };

      return CallConfig;

    });

})(window.angular);

(function (angular) {
  'use strict';

  angular.module('decipher.debaser').factory('$superpowers',
    ['$call', '$window', '$parse', function $superpowersFactory(call, $window, $parse) {

      var SINON_EXCLUDE = [
        'create',
        'resetBehavior',
        'isPresent'
      ];

      var sinon = $window.sinon,
          console = $window.console;

      var isSinon = function isSinon(value) {
        return value.displayName === 'stub' || value.displayName === 'spy';
      };

      var debaserConstantCallback = function debaserConstantCallback(module) {
        if (this.name && this.stub) {
          return module.constant(this.name, this.stub);
        }
      };

      var module = function module(name, deps) {
        var cfg = this.$$config();
        if (!name) {
          return console.warn('$debaser: ignoring empty call to module()');
        }
        if (!angular.isString(name)) {
          throw new Error('$debaser: module() expects a string');
        }
        cfg.module = name;
        cfg.module_dependencies = [];
        if (deps) {
          if (!angular.isArray(deps)) {
            throw new Error('$debaser: module() expects array or undefined as second parameter');
          }
          superpowers.withDeps.call(this, deps);
        }
        return call(cfg, {
          object: angular,
          func: 'module',
          args: ['module', 'module_dependencies']
        }, {
          object: angular.mock,
          func: 'module',
          args: ['module']
        });
      };
      module.$aspect = ['base'];

      var withDep = function withDep() {
        var cfg = this.$$config();
        if (!arguments.length) {
          return console.warn('$debaser: ignoring empty call to withDep()');
        }
        Array.prototype.slice.call(arguments).forEach(function (arg) {
          if (!angular.isString(arg)) {
            throw new Error('$debaser: withDep() expects one or more strings');
          }
        });
        cfg.module_dependencies.push.apply(cfg.module_dependencies,
          arguments);
      };
      withDep.$aspect = ['module'];

      var withDeps = function withDeps(arr) {
        if (!arr) {
          return console.warn('$debaser: ignoring empty call to withDeps()');
        }
        if (!angular.isArray(arr)) {
          throw new Error('$debaser: withDeps() expects an array');
        }
        superpowers.withDep.apply(this, arr);
      };
      withDeps.$aspect = ['module'];

      var func = function func(name) {
        var args = Array.prototype.slice.call(arguments, 1);
        if (!name) {
          return console.warn('$debaser: ignoring empty call to func()');
        }
        if (!angular.isString(name)) {
          throw new Error('$debaser: func() expects a name');
        }
        return superpowers.object.call(this, name,
            sinon && sinon.stub ? sinon.stub.apply(sinon, args) : function debaserStub() {
          });
      };
      func.$aspect = ['base'];

      var object = function object(name, base) {
        var cfg = this.$$config();
        if (!name) {
          return console.warn('$debaser: ignoring empty call to object()');
        }
        if (!angular.isString(name)) {
          throw new Error('$debaser: object() expects a name');
        }
        if (base && !angular.isFunction(base) && !angular.isObject(base)) {
          throw new Error('$debaser: object() second param should be an ' +
            'Object or undefined');
        }
        if (!cfg.stub) {
          if (!angular.isObject(base) && !angular.isFunction(base)) {
            base = {};
          }
          cfg.stub =
              sinon && sinon.stub && !isSinon(base) ? sinon.stub(base) : base;
        }
        if (!cfg.isChained()) {
          cfg.name = name;
          cfg.component = 'value';
          cfg.provider = function ($provide) {
            $provide[cfg.component](cfg.name, cfg.stub);
          };
          cfg.provider.$inject = ['$provide'];
          return call(cfg, {
            object: angular.mock,
            func: 'module',
            args: ['provider']
          });
        }
      };
      object.$aspect = ['base'];

      var withFunc = function withFunc(name) {
        var cfg = this.$$config();
        cfg.name = name;
        cfg.chain(debaserConstantCallback.bind(cfg));
        superpowers.func.apply(this, arguments);
      };
      withFunc.$aspect = ['module'];

      var withObject = function withObject(name) {
        var cfg = this.$$config();
        cfg.name = name;
        cfg.chain(debaserConstantCallback.bind(cfg));
        superpowers.object.apply(this, arguments);
      };
      withObject.$aspect = ['module'];

      var superpowers = {
        module: module,
        withDep: withDep,
        withDeps: withDeps,
        withFunc: withFunc,
        withObject: withObject,

        func: func,
        object: object,

        $SINON_EXCLUDE: SINON_EXCLUDE
      };

      angular.forEach(superpowers, function (fn, name) {
        if (!fn._name) {
          fn._name = name;
        }
      });

      if (sinon) {
        angular.forEach(sinon.stub, function (fn, name) {
          if (angular.isFunction(fn) && SINON_EXCLUDE.indexOf(name) === -1) {
            var sinonProxy = function sinonProxy() {
              var retval = fn.apply(this.$$config().stub, arguments);
              if (retval && retval.stub && retval.stub.func) {
                retval.end = function debaserEnd() {
                  return this;
                }.bind(this);
                return retval;
              }
            };
            sinonProxy.$aspect = ['func', 'withFunc'];
            sinonProxy._name = 'func';
            superpowers[name] = sinonProxy;
          }
        });
      }

      return superpowers;
    }]);

})(window.angular);
