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
      adapter: '$' + (sinon ? 'sinon' : 'vanilla') + 'Debaser',
      ignores: {},
      stubs: {},
      auto: false
    });


})(window.angular, window.beforeEach, window.sinon);
