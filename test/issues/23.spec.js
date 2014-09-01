(function () {
  'use strict';

  describe.only('23.spec.js', function () {

    describe('first example', function () {
      beforeEach(function () {
        debaser()
          .module('lander')
          .object('$location', {first: 'first'})
          .object('$window',
          { lander_gon: { searchKeywords: 'Test Keyword', searchLocation: 'Test City' }, location: { replace: sinon.stub() } })
          .debase();
      });

      it('should provide $location.first', inject(function ($location) {
        expect($location.first).to.equal('first');
      }));

    });

    describe('second example', function () {
      beforeEach(function () {
        debaser()
          .module('lander')
          .object('$location', {first: 'first'})
          .object('$location', {second: 'second'})
          .object('$window',
          { lander_gon: { searchKeywords: 'Test Keyword', searchLocation: 'Test City' }, location: { replace: sinon.stub() } })
          .debase();
      });

      it('should not provide $location.first', inject(function ($location) {
        expect($location.first).to.not.equal('first');
      }));

      it('should provide $location.second', inject(function ($location) {
        expect($location.second).to.equal('second');
      }));

    });

  });
})();
