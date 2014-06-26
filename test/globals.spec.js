(function (window) {
  'use strict';

  describe('window.debaser()', function () {

    var debaser,
        sandbox;

    beforeEach(function () {
      sandbox = sinon.sandbox.create('debaser');
      debaser = window.debaser;
    });

    afterEach(function () {
      sandbox.restore();
      debaser.$$debasers = {};
    });

    it('should exist', function () {
      expect(debaser).to.be.a('function');
    });

    it('should expose a $$debasers object', function () {
      expect(debaser.$$debasers).to.be.an('object');
    });

    it('should register a singleton Debaser object', function () {
      var d = debaser(),
          injector = d.$$injector;

      expect(d).to.equal(debaser.$$debasers.__default__);
      expect(d).to.be.an('object');
      expect(d instanceof injector.get('$debaser')).to.be.true;
    });

    it('should expose a global debase() function', function () {
      debaser();
      expect(window.debase).to.be.a('function');
    });

    it('should not throw up', function () {
      expect(debaser).not.to.throw();
    });

    it('should throw if you call it twice', function () {
      debaser();
      expect(debaser).to.throw('$debaser: global debaser already registered!');
    });

    it('should accept a name in addition to a singleton', function () {
      var d;
      debaser();
      expect(function () {
        d = debaser('foo');
      }).not.to.throw();
      //noinspection JSUnusedAssignment
      expect(d.$name).to.equal('foo') &&
      expect(debaser.$$debasers.foo).to.equal(d);
    });

    it('should have separate injectors per instance', function () {
      var d1 = debaser('foo'),
          d2 = debaser('bar');
      expect(d1.$injector()).not.to.equal(d2.$injector());
    });

    it('should setup options', function () {
      sandbox.spy(window.console, 'debug');
      debaser({
        debugEnabled: true
      });
      expect(window.console.debug).to.have.been.calledWith('$debaser: created singleton Debaser instance');
    });

    it('should setup options on a per-instance basis', function () {
      sandbox.spy(window.console, 'debug');
      debaser('foo', {debugEnabled: true});
      debaser('bar', {debugEnabled: false});
      expect(window.console.debug).to.have.been.calledOnce;
    });

    it('should return a named Debaser if it exists', function () {
      var d1 = debaser('foo'),
          d2 = debaser('foo');
      expect(d1).to.equal(d2);
    });
  });

})(window);
