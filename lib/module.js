/* global runConfig */

'use strict';

/**
 * @description Main module for angular-debaser.  You are unlikely to interface with this module directly.  See {@link debaser} to get started.
 */
angular.module('decipher.debaser', [])

/**
 * @name debaserRunConfig
 * @memberof module:decipher.debaser
 * @borrows debaser.__runConfig
 */
  .constant('debaserRunConfig', runConfig)
  .config(['debaserOptions', '$logProvider', '$provide',
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
