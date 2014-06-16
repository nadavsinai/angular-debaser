(function (angular) {
  'use strict';

  angular.module('decipher.debaser').config(['$injector', 'decipher.debaser.options', '$provide',
    function ($injector, global_opts, $provide) {

      if (global_opts.autoScope) {
        $provide.decorator('$controller', function ($delegate, $injector) {
          var $rootScope = $injector.get('$rootScope');
          return function (name, locals) {
            var instance;
            locals = locals || {};
            locals.$scope = locals.$scope || $rootScope.$new();
            instance = $delegate(name, locals);
            instance.scope = function scope() {
              return locals.$scope;
            };
            return instance;
          };
        });
      }

      }]);
})(window.angular);
