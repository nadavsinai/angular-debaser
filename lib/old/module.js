(function (angular, beforeEach, sinon) {
  'use strict';

  var STUB_TYPES = [
        'function',
        'object',
        'array',
        'regexp',
        'date'
      ],
      COMPONENTS = [
        'factory',
        'service',
        'provider'
      ];

  angular.module('decipher.debaser', ['ngMock'])
    .constant('decipher.debaser.constants', {
      STUB_TYPES: STUB_TYPES,
      COMPONENTS: COMPONENTS
    })
    .constant('decipher.debaser.options', {
      adapter: 'decipher.debaser.adapters.sinon',
      ignores: {},
      stubs: {},
      autoStub: false,
      autoScope: true
    });


})(window.angular, window.beforeEach, window.sinon);
