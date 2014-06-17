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

      $provide.decorator('decipher.debaser.stub', function ($delegate) {
        return angular.isObject($delegate) ? $delegate.Stub : $delegate;
      });
      $provide.decorator('decipher.debaser.adapters.sinon', function ($delegate) {
        return angular.isObject($delegate) ? $delegate.sinonAdapter : $delegate;
      });



      }]);
})(window.angular);
