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

  describe('Debaser', function () {
    var Debaser;

    beforeEach(module(function ($provide) {
      $provide.constant('decipher.debaser.options', {});
    }, 'decipher.debaser'));

    beforeEach(inject(function ($debaser) {
      Debaser = $debaser;
    }));

    describe('constructor', function () {
      it('should set defaults & call $aspect()', function () {
        sandbox.stub(Debaser.prototype, '$aspect');
        var d = new Debaser();
        expect(d.name).to.be.undefined;
        expect(d.$queue).to.eql([]);
        expect(d.$aspect).to.have.been.calledOnce;
        expect(d.$aspect).to.have.been.calledWith('base');
      });
    });

    describe('$aspect', function () {

      var d, Aspect;

      beforeEach(inject(function ($debaser, $aspect) {
        d = new $debaser('$aspect');
        Aspect = $aspect;
      }));

      it('should return current Aspect', function () {
        expect(d.$$aspect).to.equal(d.$aspect());
      });

      it('should shift Aspects', function () {
        var bar = sandbox.stub(),
            prevAspect = d.$aspect();

        sandbox.stub(Aspect.prototype, '_initProto');
        Aspect.prototype._proto = {bar: bar};        
        expect(d.$$aspect.name).to.equal('base');
        expect(d.bar).to.be.undefined;
        expect(d.$aspect()).not.to.be.undefined;
        d.$aspect('some other aspect');
        expect(d.$$aspect.name).to.equal('some other aspect');
        console.log(d.$aspect().proto);
        expect(d.bar).to.be.a('function');
        expect(d.$aspect()).to.not.equal(prevAspect);
      });

    });

    describe('debase()', function () {

      var d;

      beforeEach(function () {
        d = new Debaser();
      });

      it('should execute the functions in the queue', function () {
        var spy = sandbox.spy();
        d.$queue.push(spy);
        d.debase();
        expect(spy).to.have.been.called;
        expect(d.$queue.length).to.equal(0);
      });

      it('should return nothing', function () {
        expect(d.debase()).to.be.undefined;
      });

      it('should flush the current aspect, empty the queue and reset the aspect',
        function () {
          var queue;
          sandbox.spy(d.$$aspect, 'flush');
          sandbox.spy(d, '$aspect');
          sandbox.stub(angular, 'module');
          sandbox.stub(angular.mock, 'module');
          d.module('foo');
          expect(d.$aspect).to.have.been.calledOnce;
          expect(d.$aspect).to.have.been.calledWith('module');
          expect(d.$$aspect.name).to.equal('module');
          queue = d.$queue;
          expect(queue.length).to.equal(0);
          sandbox.spy(queue, 'forEach');
          d.debase();
          expect(queue.forEach).to.have.been.calledOnce;
          expect(d.$queue.length).to.equal(0);
          expect(d.$aspect).to.have.been.calledTwice;
          expect(d.$aspect).to.have.been.calledWith('base');
          expect(d.$$aspect.name).to.equal('base');
        });
    });
  });

})(window);