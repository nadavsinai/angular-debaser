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
        if (current_aspect) {
          this.$queue.push.apply(this.$queue, current_aspect.flush());
        }
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
