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
  .constant('decipher.debaser.runConfig', window.debaser.$$config)
  .config(['decipher.debaser.options', '$logProvider', '$provide',
    function config(options, $logProvider, $provide) {
      // older versions of angular-mocks do not implement this function.
      if (angular.isFunction($logProvider.debugEnabled)) {
        $logProvider.debugEnabled(options.debugEnabled);
      }
      // likewise, maybe no debug() either
      $provide.decorator('$log', ['$delegate', function ($delegate) {
        $delegate.debug = $delegate.debug || options.debugEnabled ? $delegate.log : angular.noop;
        return $delegate;
      }]);
    }
  ]);

