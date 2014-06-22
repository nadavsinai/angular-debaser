(function (window, angular) {
  'use strict';

  var console = window.console, mock = angular.mock,

      DEFAULTS = {
        debugEnabled: false
      };

  angular.module('decipher.debaser', [])
    .config(['decipher.debaser.options', '$logProvider', '$provide',
      function config(options, $logProvider, $provide) {
        $logProvider.debugEnabled(options.debugEnabled);
        $provide.decorator('$log', ['$delegate', function ($delegate) {
          return $delegate.debug;
        }]);
      }
    ])
    .factory('$debaser', ['$log', function $debaserFactory($log) {

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

      var module = function module(name) {
        var modules,
            err = new Error('$debaser: module() expects a string or array of strings (module names)');
        if (angular.isString(name)) {
          modules = [name];
        } else if (angular.isArray(name)) {
          name.forEach(function (str) {
            if (!angular.isString(str)) {
              throw err;
            }
          });
          modules = name;
        } else {
          throw err;
        }
        return modules;
      };
      module.aspect = 'base';
      module.setup = function (modules) {
        var queue = this.$invokeQueue;
        modules.forEach(function (name) {
          queue.push(new Call(angular, 'module', [name, []], angular));
          queue.push(new Call(mock, 'module', [name], mock));
        });
      };

      var chainable = {
        module: module
      };

      var Debaser = function Debaser(name) {
        this.name = name;
        this.$queue = [];
        this.$aspect('base');
        if (name) {
          $log('$debaser: created Debaser instance with name "' + name + '"');
        } else {
          $log('$debaser: created singleton Debaser instance');
        }
      };

      Debaser.createProxy = function createProxy(fn, name) {
        var proxy;
        if (Debaser.createProxy.cache[name]) {
          return Debaser.createProxy.cache[name];
        }
        proxy = function proxy() {
          var debaser = this,
              retval = fn.apply(debaser, arguments);
          if (fn.setup) {
            fn.setup.call(debaser.$$aspect, retval);
          }
          if (fn.teardown) {
            fn.teardown.call(debaser.$$aspect, retval);
          }
          debaser.$aspect(name);
          return debaser;
        };
        Debaser.createProxy.cache[name] = proxy;
        return proxy;
      };
      Debaser.createProxy.cache = {};

      Debaser.aspectMethods = function aspectMethods(aspect) {
        var methods = {};
        if (Debaser.aspectMethods.cache[aspect]) {
          return Debaser.aspectMethods.cache[aspect];
        }
        angular.forEach(chainable, function (fn, name) {
          if (fn.aspect === 'base' || fn.aspect === aspect) {
            methods[name] = Debaser.createProxy(fn, name);
          }
        });
        Debaser.aspectMethods.cache[aspect] = methods;
        return methods;
      };
      Debaser.aspectMethods.cache = {};

      Debaser.deserialize = function deserialize(queue) {
        return queue.map(function (c) {
          return c.deserialize();
        });
      };

      Debaser.prototype.$aspect = function $aspect(name) {
        var methods = Debaser.aspectMethods(name),
            current_aspect = this.$$aspect,
            queue,
            current_aspect_name = this.$$aspect_name,
            aspect = {},
            debaser = this;
        if (name !== 'base' || current_aspect_name === name) {
          return;
        }
        if (current_aspect) {
          queue = current_aspect.$invokeQueue;
          Object.keys(current_aspect).forEach(function (name) {
            delete debaser[name];
          });
          if (queue.length) {
            debaser.$queue.concat(Debaser.deserialize(queue));
            current_aspect.$invokeQueue = [];
          }
        }
        angular.forEach(methods, function (fn, name) {
          aspect[name] = debaser[name] = fn;
        });
        debaser.$$aspect = aspect;
        debaser.$$aspect.$invokeQueue = [];
        debaser.$$aspect_name = name;
      };

      Debaser.prototype.$injector = function $injector() {
        if (this.$$injector) {
          return this.$$injector;
        }
        throw new Error('$debaser: no local injector');
      };
      //
      //      Debaser.prototype.$enqueue = function $enqueue() {
      //        var args = Array.prototype.slice.call(arguments);
      //        args.forEach(function (arg) {
      //          this.$queue.push(arg);
      //        }, this);
      //      };
      //

      Debaser.prototype.debase = function debase() {
        var queue = this.$$aspect.$invokeQueue;
        if (queue.length) {
          this.$queue.concat(Debaser.deserialize(queue));
        }
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
        debasers[name] = instance = new Debaser(name);
        instance.$$injector = injector;
      }
      return debasers[name];
    }
    debasers.__default__ = instance = new Debaser();
    instance.$$injector = injector;
    window.debase = instance.debase.bind(instance);
    return debasers.__default__;
  };
  window.debaser.$$debasers = {};

})(window, window.angular);
