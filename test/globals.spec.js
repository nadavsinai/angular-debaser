(function (window) {
  'use strict';

  describe('window.debaser()', function () {

    var debaser;

    beforeEach(function () {
      debaser = window.debaser;
    });

    afterEach(function () {
      debaser.__debasers = {};
    });

    it('should exist', function () {
      expect(debaser).to.be.a('function');
    });

    it('should expose a __debasers object', function () {
      expect(debaser.__debasers).to.be.an('object');
    });

    it('should not recycle Debaser instances within a spec', function () {
      var d = debaser();
      expect(d).to.be.an('object');
      expect(debaser()).to.not.equal(d);
    });

    it('should expose a global debase() function', function () {
      debaser();
      expect(window.debase).to.be.a('function');
    });

    it('should not throw up', function () {
      expect(debaser).not.to.throw();
    });

    it('should not throw if you call it twice', function () {
      debaser();
      expect(debaser).not.to.throw();
    });

    it('should accept a name in addition to a singleton', function () {
      var d;
      debaser();
      expect(function () {
        d = debaser('foo');
      }).not.to.throw();
      //noinspection JSUnusedAssignment
      expect(d.$name).to.equal('foo') &&
      expect(debaser.__debasers.foo).to.equal(d);
    });

    it('should return a named Debaser if it exists', function () {
      var d1 = debaser('foo'),
          d2 = debaser('foo');
      expect(d1).to.equal(d2);
    });
  });

})(window);
