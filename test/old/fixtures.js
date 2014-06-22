(function(angular) {
  'use strict';

  beforeEach(angular.mock.module(function ($provide, $injector) {
    $provide.provider('$stub', ['decipher.debaser.stubProvider', function (StubProvider) {
      angular.extend(this, StubProvider);
      if (angular.isFunction(StubProvider)) {
        return StubProvider;
      }
    }]);
    $provide.provider('$sinonAdapter', ['decipher.debaser.adapters.sinonProvider', function (SinonProvider) {
      angular.extend(this, SinonProvider);
      if (angular.isFunction(SinonProvider)) {
        return SinonProvider;
      }
    }]);
    $provide.constant('$utils', $injector.get('decipher.debaser.utils'));
    $provide.constant('$constants', $injector.get('decipher.debaser.constants'));
    $provide.constant('$options', $injector.get('decipher.debaser.options'));
  }));

})(window.angular);
