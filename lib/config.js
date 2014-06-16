(function(angular, debase) {
  'use strict';

  angular.module('decipher.debaser').config(['$injector', 'decipher.debaser.utils', 'decipher.debaser.constants',
      'decipher.debaser.stubProvider', 'decipher.debaser.options',
      function ($injector, utils, constants, Stub, global_opts) {
        debase.stub = function stub(type, opts) {
          var STUB_TYPES = constants.STUB_TYPES,
              contains = utils.contains;

          opts = angular.extend({}, global_opts, opts);
          if (!type) {
            throw new Error('Parameter required');
          }
          if (angular.isString(type)) {
            type = type.toLowerCase();
            if (!contains(STUB_TYPES, type)) {
              throw new Error('Unknown stub type "' + type + '".  Valid types are: ' +
                STUB_TYPES.join(', ') + '. To use a custom value, do not use this function.');
            }
            return new Stub({
              $type: type
            }, opts);
          }
          return new Stub({
            $proxy: type.bind(opts.context || null)
          }, opts);
        };
        debase._enabled = true;
      }]);
})(window.angular, window.debase);
