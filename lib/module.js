(function (angular, debaser) {

  'use strict';

  /**
   * @name decipher.debaser
   * @description
   *
   * This is the main module for angular-debaser.  You are unlikely to interface
   * with this module directly.
   */
  angular.module('decipher.debaser', [])

  /**
   * @name decipher.debaser.runConfig
   * @memberof decipher.debaser
   * @type Object
   */
    .constant('decipher.debaser.runConfig', debaser.$$config)
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

})(window.angular, window.debaser);
