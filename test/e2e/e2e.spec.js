(function (window) {

  'use strict';

  var angular = window.angular,
      module = angular.mock.module,
      inject = angular.mock.inject,
      sandbox;

  beforeEach(function () {
    sandbox = sinon.sandbox.create('debaser');
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('e2e', function () {
    before(function () {
      angular.module('bar', ['foo'])
        .value('baz', 'quux');
      window.debaser()
        .module('foo')
        .func('herp')
        .returns('derp')
        .yields()
        .module('gobo');
      expect(window.debase).to.be.a('function');
    });

    beforeEach(function () {
      sandbox.spy(angular, 'module');
      sandbox.spy(angular.mock, 'module');
      window.debase();
      module('bar');
      expect(function () {
        module('gobo');
      }).not.to.throw();
    });

    it('should provide dependencies for module "bar"', inject(function (baz) {
      expect(baz).to.equal('quux');
    }));

    it('should provide a stub named "herp"', inject(function (herp) {
      var cb = sinon.stub();
      expect(herp).to.be.a('function');
      expect(herp.displayName).to.equal('stub');
      expect(herp(cb)).to.equal('derp');
      expect(cb).to.have.been.calledOnce;
    }));

  });

})(window);
