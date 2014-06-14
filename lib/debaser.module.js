;(function () {
  'use strict';

  angular.module('decipher.debaser', ['ngMock'])
    .constant('decipher.debaser.options', {})
    .config([
      '$debaseProvider', 'decipher.debaser.options',
      function ($debaseProvider, options) {
        $debaseProvider.adapter =
          '$' + (options.adapter || (!!window.sinon ? 'sinon' : 'vanilla')) +
          'Debaser';
      }]);

})();
