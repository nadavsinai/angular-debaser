(function () {
  'use strict';

  window.sandbox;

  beforeEach(function () {
    window.sandbox = sinon.sandbox.create('debaser');
  });

  afterEach(function () {
    window.sandbox.restore();
  });

  beforeEach(module(function ($provide) {
    $provide.constant('debaserOptions', {});
  }, 'decipherDebaser'));

})();
