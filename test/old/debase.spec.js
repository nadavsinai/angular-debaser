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
          beforeEach = sandbox.stub(window, 'beforeEach').yieldsOn(this);

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

    it('should work with sinon adapter', function () {
      var baz = {
            spam2: function () {
              return 'eggs';
            }
          },
          $controller,
          beforeEach = sandbox.stub(window, 'beforeEach').yieldsOn(this),
          stubs = {
            baz: debase.stub('object', baz).getStub().spam2.returns('ham').base(),
            herp: debase.stub('function', function($q) {
              return $q.when('derp');
            }, {inject: ['$q']})
          },
          scope,
          stub;
      angular.module('foo', [])
        .controller('bar', function ($scope, baz, herp) {
          $scope.quux = function () {
            return baz.spam2();
          };
          $scope.herp = herp;

        });

      debase('foo', 'bar', {
        stubs: stubs
      });

      inject(function (_baz_, _$controller_) {
        stub = _baz_;
        $controller = _$controller_;
      });
      expect(stub).to.be.an('object');
      expect(stub.spam2).to.be.a('function');
      expect(stub.spam2).to.have.property('callCount');
      expect(stub.spam2()).to.equal('ham');

      scope = $controller('bar').scope();

      expect(scope.quux()).to.equal('ham');
      expect(scope.herp()).to.be.an('object');
      expect(scope.herp()).to.have.property('then');

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

