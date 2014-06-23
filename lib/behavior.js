(function (angular) {
  'use strict';

  angular.module('decipher.debaser').factory('$behavior',
    ['$call', function $behaviorFactory(Call) {

      // this is called in the context of a Debaser
      var module = function module(name) {
        var modules,
            err = new Error('$debaser: module() expects a string or array of strings (module names)');
        if (angular.isString(name)) {
          modules = [name];
        } else if (angular.isArray(name)) {
          name.forEach(function (str) {
            if (!angular.isString(str)) {
              throw err;
            }
          });
          modules = name;
        } else {
          throw err;
        }
        return modules;
      };
      module.aspect = 'base';

      // this is called in the context of an Aspect
      module.setup = function (modules) {
        var queue = this.$invokeQueue;
        modules.forEach(function (name) {
          queue.push(new Call(angular, 'module', [name, []], angular));
          queue.push(new Call(angular.mock, 'module', [name], angular.mock));
        });
      };

      return {
        module: module
      };
    }]);

})(window.angular);
