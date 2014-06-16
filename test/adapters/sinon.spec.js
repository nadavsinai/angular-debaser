(function (window, debase, angular, sinon) {
  'use strict';

  var sandbox,
      adapter,
      module = angular.mock.module,
      inject = angular.mock.inject;


  describe('sinon adapter', function () {
    beforeEach(function () {
      sandbox = sinon.sandbox.create('adapters.sinon');
      module('decipher.debaser', function ($sinonAdapterProvider) {
        adapter = $sinonAdapterProvider();
      });
      inject();
      sandbox.stub(window, 'beforeEach');
    });

    afterEach(function () {
      sandbox.restore();
    });

    it('should return an object', function () {
      expect(adapter.object()).to.deep.equal({});
    });

    it('should stub functions in an object', function () {
      var stub,
          original = {
            foo: function () {

            },
            bar: 'baz'
          };
      stub = adapter.object(original);
      expect(stub.bar).to.equal('baz');
      expect(stub.foo).to.have.property('callCount');
      expect(original.foo).not.to.have.property('callCount');
      window.beforeEach.firstCall.args[0](stub);
      expect(original.foo).to.have.property('callCount');

    });

    it('should pass through to sinon.stub() for a function', function () {
      var stub,
          obj = {
            fn: function () {
              return 'foo';
            }
          };
      expect(adapter.function(obj.fn)).to.be.a('function');
      expect(adapter.function(obj.fn)).to.have.property('callCount');
      expect(adapter.function(obj.fn)()).to.equal('foo');
      stub = adapter.function(obj, 'fn').returns('bar');
      expect(obj.fn()).to.equal('foo');
      expect(stub()).to.equal('bar');
      window.beforeEach.firstCall.args[0](stub);
      expect(obj.fn()).to.equal('bar');
    });

    it('should stub each function member of an array', function () {
      var arr = ['foo', function () {
        return 'bar';
      }], stub;
      expect(adapter.array()).to.deep.equal([]);
      stub = adapter.array(arr);
      expect(stub.length).to.equal(2);
      expect(stub[0]).to.equal('foo');
      expect(stub[1]).to.be.a('function');
      expect(stub[1]).to.have.property('callCount');
      stub[1].returns('baz');
      expect(arr[1]()).to.equal('bar');
      window.beforeEach.firstCall.args[0](stub[1]);
      expect(arr[1]()).to.equal('baz');
    });

  });
})(window, window.debase, window.angular, window.sinon);

