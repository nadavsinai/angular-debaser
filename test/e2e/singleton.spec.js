(function () {
  'use strict';

  describe('singleton usage', function () {

    var marvin = 'marvin o\'gravel balloon face';

    describe('before', function () {

      before(function () {
        angular.module('putt-putt', [])
          .factory('moonface', function (ziggy) {
            return ziggy();
          });
        expect(function () {
          debaser()
            .module('putt-putt')
            .module('soggy muff')
            .module('buffalo bill')
            .module('biffalo buff')
            .object('sneepy')
            .func('weepyWeed')
            .object('paris_garters')
            .func('ziggy')
            .returns(marvin)
            .object('harris_tweed');
        }).not.to.throw();
      });

      beforeEach(debase());

      describe('after debase', function () {

        var moonface;

        beforeEach(inject(function (_moonface_) {
          moonface = _moonface_;
        }));

        it('should provide "moonface", a function which returns "marvin"', function () {
          expect(moonface).to.equal(marvin);
        });

        it('should still provide "moonface", a function which returns "marvin"', function () {
          expect(moonface).to.equal(marvin);
        });

      });

    });

    describe('named', function () {

      before(function () {
        angular.module('putt-putt', [])
          .factory('moonface', function (ziggy) {
            return ziggy();
          });
        expect(function () {
          debaser('zanzibar buck-buck mcfate')
            .module('putt-putt')
            .module('soggy muff')
            .module('buffalo bill')
            .module('biffalo buff')
            .object('sneepy')
            .func('weepyWeed')
            .object('paris_garters')
            .func('ziggy')
            .returns(marvin)
            .object('harris_tweed');
        }).not.to.throw();
      });

      beforeEach(function () {
        expect(debase).to.throw('debaser: no Debaser initialized!');
        debase('zanzibar buck-buck mcfate');
      });

      describe('after debase', function () {

        var moonface;

        beforeEach(inject(function (_moonface_) {
          moonface = _moonface_;
        }));

        it('should provide "moonface", a function which returns "marvin"', function () {
          expect(moonface).to.equal(marvin);
        });

        it('should still provide "moonface", a function which returns "marvin"', function () {
          expect(moonface).to.equal(marvin);
        });

      });
    });

    describe('bare context', function () {

      angular.module('putt-putt', [])
        .factory('moonface', function (ziggy) {
          return ziggy();
        });

      debaser('dave')
        .module('putt-putt')
        .module('soggy muff')
        .module('buffalo bill')
        .module('biffalo buff')
        .object('sneepy')
        .func('weepyWeed')
        .object('paris_garters')
        .func('ziggy')
        .returns(marvin)
        .object('harris_tweed');

      it('should throw', function () {
        expect(function () {
          debase('dave');
        }).to.throw('debaser: cannot find Debaser instance with name "dave"');
      });

    });

    describe('when used in it() block', function () {

      before(function () {
        angular.module('putt-putt', [])
          .factory('moonface', function (ziggy) {
            return ziggy();
          });
        expect(function () {
          debaser()
            .module('putt-putt')
            .module('soggy muff')
            .module('buffalo bill')
            .module('biffalo buff')
            .object('sneepy')
            .func('weepyWeed')
            .object('paris_garters')
            .func('ziggy')
            .returns(marvin)
            .object('harris_tweed');
        }).not.to.throw();
      });

      describe('debasing in it() block', function () {

        var moonface;

        it('should provide "moonface", a function which returns "marvin"', function () {
          debase();
          inject(function (moonface) {
            expect(moonface).to.equal(marvin);
          });
        });

        it('should still provide "moonface", a function which returns "marvin"', function () {
          debase();
          inject(function (moonface) {
            expect(moonface).to.equal(marvin);
          });
        });

      });
    });

  });

})();
