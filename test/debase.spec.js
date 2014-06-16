(function (debase, angular, sinon) {
  'use strict';

  var sandbox,
      module = angular.mock.module,
      inject = angular.mock.inject;

  beforeEach(function () {
    sandbox = sinon.sandbox.create('debase');
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('debase', function () {

    it('should throw if no module name', function () {
      expect(debase).to.throw('debase requires a module name parameter');
    });

    it('should throw if targets undefined', function () {
      expect(function () {
        debase('foo');
      }).to.throw('debase requires one or more target components');
    });

    it('should throw if targets empty', function () {
      expect(function () {
        debase('foo', []);
      }).to.throw('debase requires one or more target components');
    });

    it('should stub something', function () {
      var stubs = {
            baz: 'object'
          },
          adapter = {
            object: function () {
              return {};
            }
          },
          baz,
          beforeEach = sandbox.stub(window, 'beforeEach').callsArg(0);

      angular.module('foo', [])
        .controller('bar', function ($scope, baz) {
          $scope.quux = function () {
            return baz;
          };
        });


      debase('foo', 'bar', {
        stubs: stubs,
        adapter: adapter
      });

      expect(window.beforeEach).to.have.been.called;

      inject(function (_baz_) {
        baz = _baz_;
      });
      expect(baz).to.deep.equal({});
    });


    describe('options()', function () {
      it('should modify global options', inject(function ($options) {
        debase.options({
          auto: true
        });
        expect($options.auto).to.be.true;
      }));
    });
  });
})(window.debase, window.angular, window.sinon);

