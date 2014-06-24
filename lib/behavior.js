(function (angular) {
  'use strict';

  angular.module('decipher.debaser').factory('$behavior',
    ['$call', function $behaviorFactory(call) {

      // this is called in the context of a Debaser
      var module = function module(name) {
        if (!angular.isString(name)) {
          throw new Error('$debaser: module() expects a string');
        }
        return [
          call(angular, 'module', [name, []], angular),
          call(angular.mock, 'module', [name], angular.mock)
        ];
      };
      module.aspect = 'base';

      return {
        module: module
      };
    }]);

})(window.angular);
