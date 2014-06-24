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
    .factory('$debaser',
    ['$log', '$aspect', function $debaserFactory($log, Aspect) {

      var Debaser = function Debaser(name) {
        this.$name = name || '__default__';
        this.$queue = [];
        this.$aspect('base');
        if (name) {
          $log('$debaser: created Debaser instance with name "' + name + '"');
        } else {
          $log('$debaser: created singleton Debaser instance');
        }
      };

      Debaser.prototype.$aspect = function $aspect(name, actions) {
        var current_aspect = this.$$aspect,
            current_aspect_name,
            aspect,
            debaser = this;
        aspect = Aspect.create(name, debaser);
        if (current_aspect) {
          current_aspect_name = current_aspect.name();
          if (current_aspect_name !== 'base' && current_aspect_name !== name) {
            Object.keys(current_aspect).forEach(function (name) {
              delete debaser[name];
            });
            current_aspect.flush();
          } else {
            aspect.merge(current_aspect);
          }
        }
        if (actions) {
          aspect.queue(actions);
        }
        angular.extend(debaser, aspect.proto());
        debaser.$$aspect = aspect;
      };

      Debaser.prototype.$injector = function $injector() {
        if (this.$$injector) {
          return this.$$injector;
        }
        throw new Error('$debaser: no local injector');
      };

      Debaser.prototype.$enqueue = function $enqueue() {
        var args = Array.prototype.slice.call(arguments);
        args.forEach(function (arg) {
          this.$queue.push(arg);
        }, this);
      };

      Debaser.prototype.debase = function debase() {
        this.$$aspect.flush();
        if (this.$name === '__default__') {
          window.console.info(this.$queue);
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
    return instance;
  };
  window.debaser.$$debasers = {};

})(window, window.angular);
