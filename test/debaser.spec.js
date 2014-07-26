(function () {

  'use strict';

  describe('Debaser', function () {
    var Debaser,
        $log;

    beforeEach(inject(['debaserDebaser', '$log', function (_Debaser_, _$log_) {
      Debaser = _Debaser_;
      $log = _$log_;
    }]));

    describe('constructor', function () {
      it('should set defaults, report & call $aspect()', function () {
        var d;
        sandbox.stub(Debaser.prototype, '$aspect');
        sandbox.stub($log, 'debug', $log.log);
        d = new Debaser();
        expect(d.name).to.be.undefined;
        expect(d.$queue).to.eql([]);
        expect(d.$aspect).to.have.been.calledOnce;
        expect(d.$aspect).to.have.been.calledWith('base');
        expect($log.debug).to.have.been.calledOnce;
      });
    });

    describe('method', function () {
      describe('$aspect()', function () {

        var d, Aspect;

        beforeEach(inject(['debaserAspect', function (_Aspect_) {
          d = new Debaser('$aspect');
          Aspect = _Aspect_;
        }]));

        it('should return same type of Aspect', function () {
          expect(d.$$aspect.name).to.equal(d.$aspect().name);
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
          expect(d.bar).to.be.a('function');
          expect(d.$aspect()).to.not.equal(prevAspect);
        });

      });

      describe('debase()', function () {

        var d;

        beforeEach(function () {
          d = new Debaser('debase');
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

  });

})();
