/*! angular-debaser - v0.1.0 - 2014-06-26
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
    ['$log', '$aspect', function $debaserFactory($log, aspect) {

      var Debaser = function Debaser(name, injector) {
        if (!angular.isString(name)) {
          injector = name;
          name = Debaser.DEFAULT_NAME;
        }
        this.$name = name;
        this.$$injector = injector;
        this.$Aspect = aspect();
        this.$queue = [];
        this.$aspect('base');
        if (name !== Debaser.DEFAULT_NAME) {
          $log('$debaser: created Debaser instance with name "' + name + '"');
        } else {
          $log('$debaser: created singleton Debaser instance');
        }
      };

      Debaser.DEFAULT_NAME = '__default__';

      Debaser.prototype.$aspect = function $aspect(name) {
        var current_aspect = this.$$aspect,
            current_aspect_name,
            aspect;
        if (!name) {
          return;
        }
        if (current_aspect) {
          current_aspect_name = current_aspect.name();
          if (current_aspect_name !== 'base' && current_aspect_name !== name) {
            Object.keys(current_aspect.proto()).forEach(function (name) {
              delete this[name];
            }, this);
            this.$enqueue();
          }
        }
        aspect = this.$Aspect.create(name, current_aspect);
        angular.extend(this, aspect.proto());
        this.$$aspect = aspect;
      };

      Debaser.prototype.$injector = function $injector() {
        if (this.$$injector) {
          return this.$$injector;
        }
        throw new Error('$debaser: no local injector');
      };

      Debaser.prototype.$enqueue = function $enqueue() {
        var current_aspect = this.$$aspect;
        if (!current_aspect) {
          return;
        }
        this.$queue.push.apply(this.$queue, current_aspect.flush());
      };

      Debaser.prototype.debase = function debase() {
        this.$enqueue();
        this.$queue.forEach(function (fn) {
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
      throw new Error('$debaser: global debaser already registered!');
    }

    opts = opts || {};
    injector = angular.injector(['ng', setup(opts), 'decipher.debaser']);
    Debaser = injector.get('$debaser');

    if (name) {
      if (!debasers[name]) {
        debasers[name] = new Debaser(name, injector);
      }
      return debasers[name];
    }
    debasers.__default__ = instance = new Debaser(injector);
    window.debase = instance.debase.bind(instance);
    return instance;
  };
  window.debaser.$$debasers = {};

})(window, window.angular);

(function (angular) {
  'use strict';

  angular.module('decipher.debaser').factory('$aspect', ['$superpowers',
    function $aspectFactory(superpowers) {
      var Aspect = function Aspect(name, parent) {
        this.$name = name;
        this.$parent = parent;
        this.createProxy.cache = parent ? parent.createProxy.cache : {};
        this.$behavior = parent ? parent.$behavior : [];
        this.$behavior.$config = this.$behavior.$config || {};
        this.$proto = this.proto();
      };

      Aspect.prototype.behavior = function behavior() {
        return this.$behavior;
      };

      Aspect.prototype.proto = function proto() {
        var o = {};
        if (this.$proto) {
          return this.$proto;
        }
        angular.forEach(superpowers, function (fn, name) {
          if (fn.$aspect === this.$name) {
            o[name] = this.createProxy(fn, name);
          }
        }, this);
        if (this.$parent) {
          angular.extend(o, this.$parent.proto());
        }
        return o;
      };

      Aspect.prototype.flush = function flush() {
        var behavior = this.$behavior,
            queue = behavior.map(function (c) {
              return c.deserialize();
            });
        return queue;
      };

      Aspect.prototype.name = function name() {
        return this.$name;
      };

      Aspect.prototype.createProxy = function createProxy(fn, name) {
        var proxy,
            cache = this.createProxy.cache,
            behavior,
            config;
        if (cache[name]) {
          return cache[name];
        }
        behavior = this.$behavior;
        config = behavior.$config;
        proxy = function proxy() {
          var call = fn.apply(config, arguments);
          if (call) {
            behavior.push.apply(behavior, call);
          }
          this.$aspect(name);
          return this;
        };
        cache[name] = proxy;
        return proxy;
      };

      Aspect.create = function create(name, parent) {
        var aspect, cache = Aspect.create.cache;
        if (cache[name]) {
          return cache[name];
        }
        aspect = new Aspect(name, parent);
        cache[name] = aspect;
        return aspect;
      };

      return function () {
        Aspect.create.cache = {};

        return Aspect;

      };
    }]);

})(window.angular);

(function(angular) {
  'use strict';

  angular.module('decipher.debaser')
    .factory('$call', function $callFactory() {

      var Call = function Call(object, fn_name, args, ctx) {
        this.object = object;
        this.fn_name = fn_name;
        this.args = args;
        this.ctx = ctx || null;
      };

      Call.prototype.deserialize = function deserialize() {
        var object = this.object,
            fn_name = this.fn_name,
            args = this.args,
            ctx = this.ctx;

        return function debaserCall() {
          object[fn_name].apply(ctx, args);
        };
      };

      return function call() {
        if (angular.isArray(arguments[0])) {
          return Array.prototype.slice.call(arguments).map(function (arg) {
            return new Call(arg[0], arg[1], arg[2], arg[3]);
          });
        }
        return [new Call(arguments[0], arguments[1], arguments[2], arguments[3])];
      };

    });

})(window.angular);

(function (angular) {
  'use strict';

  angular.module('decipher.debaser').factory('$superpowers',
    ['$call', '$window', function $superpowersFactory(call, $window) {

      var sinon = $window.sinon;

      var module = function module(name) {
        if (!name) {
          return;
        }
        if (!angular.isString(name)) {
          throw new Error('$debaser: module() expects a string');
        }
        this.module = name;
        this.module_dependencies = [];
        return call([angular, 'module', [this.module, this.module_dependencies],
          angular], [angular.mock, 'module', [name], angular.mock]);
      };
      module.$aspect = 'base';

      var withDep = function withDep() {
        if (!arguments.length) {
          return;
        }
        Array.prototype.slice.call(arguments).forEach(function (arg) {
          if (!angular.isString(arg)) {
            throw new Error('$debaser: withDep() expects one or more strings');
          }
        });
        this.module_dependencies.push.apply(this.module_dependencies,
          arguments);
      };
      withDep.$aspect = 'module';

      var withDeps = function withDeps(arr) {
        if (!arr) {
          return;
        }
        if (!angular.isArray(arr)) {
          throw new Error('$debaser: withDeps() expects an array');
        }
        superpowers.withDep.apply(this, arr);
      };
      withDeps.$aspect = 'module';

      var func = function func(name) {
        if (!name) {
          return;
        }
        if (!angular.isString(name)) {
          throw new Error('$debaser: func() expects a name');
        }
        this.stub = sinon.stub();
        this.name = name;
        this.component = 'value';
        this.provider = function ($provide) {
          $provide[this.component](this.name, this.stub);
        }.bind(this);
        this.provider.$inject = ['$provide'];
        return call(angular.mock, 'module', [this.provider], angular.mock);
      };
      func.$aspect = 'base';

      var superpowers = {
        module: module,
        withDep: withDep,
        withDeps: withDeps,

        func: func
      };

      //TODO: identify which we can really use.
      angular.forEach(sinon.stub, function (fn, name) {
        var sinonProxy = function sinonProxy() {
          fn.apply(this.stub, arguments);
        };
        sinonProxy.$aspect = 'func';
        superpowers[name] = sinonProxy;
      });

      return superpowers;
    }]);

})(window.angular);
