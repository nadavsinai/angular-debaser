(function () {
  'use strict';

  describe('multiple instances', function () {

    var marvin = 'marvin o\'gravel balloon face';

    before(function () {
      angular.module('putt-putt', [])
        .factory('moonface', function (ziggy) {
          return ziggy();
        });
    });

    beforeEach(function () {
      expect(function () {
        debaser('sir michael carmichael zutt', {skipConfigs: true})
          .module('putt-putt')
          .module('soggy muff')
          .module('buffalo bill')
          .module('biffalo buff')
          .object('sneepy')
          .debase();
        debaser('oliver boliver butt', {skipConfigs: true})
          .func('weepyWeed')
          .object('paris_garters')
          .func('ziggy')
          .returns(marvin)
          .object('harris_tweed')
          .debase();
      }).not.to.throw();
    });

    describe('two instances', function () {

      var moonface;

      beforeEach(inject(function (_moonface_) {
        moonface = _moonface_;
      }));

      it('should provide "moonface", a function which returns "marvin"', function () {
        expect(moonface).to.equal(marvin);
      });

    });
  });

})();
