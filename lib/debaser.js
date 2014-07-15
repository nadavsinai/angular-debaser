'use strict';

angular.module('decipher.debaser').factory('decipher.debaser.debaser',
  ['$log', 'decipher.debaser.aspect', 'decipher.debaser.options', '$window',
    function $debaserFactory($log, Aspect, options, $window) {

      var beforeEach = $window.beforeEach,
          default_name = options.default_name;

      /**
       * @name Debaser
       * @param name
       * @constructor
       */
      var Debaser = function Debaser(name) {
        if (!angular.isString(name)) {
          name = options._default_name;
        }
        this.$name = name;
        this.$queue = [];
        this.$aspect('base');
        if (name !== default_name) {
          $log.debug('$debaser: created Debaser instance with name "' + name + '"');
        } else {
          $log.debug('$debaser: created singleton Debaser instance');
        }
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

      Debaser.prototype.debase = function debase(opts) {
        opts = opts || {};
        this.$enqueue();
        this.$queue.forEach(function (fn) {
          fn();
        });
        if (!opts.persist) {
          this.$queue = [];
        }
        this.$aspect('base');
        if (options.autoScope) {
          angular.mock.module(Debaser.autoScopeProvider);
        }
      };

      return Debaser;
    }]);

