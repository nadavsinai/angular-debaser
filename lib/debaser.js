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
