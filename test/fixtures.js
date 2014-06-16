(function(module) {
  'use strict';

  beforeEach(module(function ($provide, $injector) {
    $provide.provider('$stub', ['decipher.debaser.stubProvider', function (StubProvider) {
      return StubProvider;
    }]);
    $provide.constant('$utils', $injector.get('decipher.debaser.utils'));
    $provide.constant('$constants', $injector.get('decipher.debaser.constants'));
    $provide.constant('$options', $injector.get('decipher.debaser.options'));
  }));

})(window.angular.mock.module);
