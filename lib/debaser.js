'use strict';

angular.module('decipher.debaser').factory('debaserDebaser',
  ['$log', 'debaserAspect', 'debaserOptions', '$window',
    function debaserFactory($log, Aspect, options, $window) {

      var defaultName = options.defaultName;


      /**
       * @description Provides an object with which you can stub AngularJS dependencies.  Do not attempt to instantiate this class directly; use the {@link debaser} function instead.
       * @public
       * @mixes base
       * @global
       * @param {string} [name=__default__] Name of Debaser instance
       * @class
       */
      var Debaser = function Debaser(name) {
        if (!angular.isString(name)) {
          name = options.defaultName;
        }
        this.$name = name;
        this.$queue = [];
        this.$aspect('base');
        if (name !== defaultName) {
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

      /**
       * @description All previously queued stubs will be installed upon execution of this method.
       * @param {Object} [opts] Options
       * @param {boolean} [opts.persist=false] If true, retain the queue.  Only used in a non-spec context; {@link debase window.debase} can call it with this option.  You probably don't want to specify this yourself.
       * @returns undefined
       */
      Debaser.prototype.debase = function debase(opts) {
        opts = opts || {};
        this.$enqueue();
        if ($window.jasmine) {
          angular.mock.module(function($provide) {
            $provide.value('$$jasmineHack$$', null);
          });
        }
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

