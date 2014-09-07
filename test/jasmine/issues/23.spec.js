(function () {
  'use strict';

  describe('angular-debaser#23', function () {

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
        expect($location.first).toEqual('first');
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

      it('should NOT provide $location.first', inject(function ($location) {
        expect($location.first).not.toBeDefined;
      }));

      it('should provide $location.second', inject(function ($location) {
        expect($location.second).toEqual('second');
      }));

    });

  });
})();
