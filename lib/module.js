(function (window, angular) {
  'use strict';

  var DEFAULTS = {
    debugEnabled: false
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
    .constant('decipher.debaser.runConfig', window.debaser.$$config)
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
    ]);

})(window, window.angular);
