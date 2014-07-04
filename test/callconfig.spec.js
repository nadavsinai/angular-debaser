(function () {

  'use strict';

  describe.only('CallConfig', function () {

    var CallConfig;

    beforeEach(inject(function ($callConfig) {
      CallConfig = $callConfig;
    }));

    describe('constructor', function () {

      it('should initialize callbacks, calls, id and callback idx',
        function () {
          var cc = new CallConfig();
          expect(cc._callbacks).to.eql([]);
          expect(cc._cb_idx).to.equal(0);
          expect(cc._id).to.equal(CallConfig._id - 1);
          expect(cc.calls).to.eql([]);
        });

      it('should extend itself with a passed object', function () {
        var cc = new CallConfig({foo: 'bar'});
        expect(cc.foo).to.equal('bar');
      });

      it('should not overwrite calls if present', function () {
        var cc = new CallConfig({calls: 'schmalls'});
        expect(cc.calls).to.equal('schmalls');
      });

    });

    describe('method', function () {

      var cc;

      beforeEach(function () {
        cc = new CallConfig();
      });

      describe('addCall()', function () {
        it('should throw if passed nothing', function () {
          expect(function () {
            cc.addCall();
          }).to.throw('$debaser: addCall() expects call options');
        });

        it('should push data onto calls array', function () {
          sandbox.stub(cc, 'runner').returns('foo');
          cc.addCall({});
          expect(cc.calls.length).to.equal(1);


        });

        it('should use the value returned by runner() as the default callback',
          function () {
            sandbox.stub(cc, 'runner').returns('foo');
            cc.addCall({});
            expect(cc.calls[0].callback).to.equal('foo');
          });

        it('should use the null context if no object passed and no context passed',
          function () {
            cc.addCall({});
            expect(cc.calls[0].context).to.be.null;
          });

        it('should use the object context if no context passed', function () {
          var o = {};
          cc.addCall({object: o});
          expect(cc.calls[0].context).to.equal(o);
        });

        it('should use the context itself if defined, even if falsy',
          function () {
            cc.addCall({context: false});
            expect(cc.calls[0].context).to.be.false;
          });

      });

      describe('next()', function () {
        it('should call done() if no callbacks left', function () {
          sandbox.stub(cc, 'done');
          expect(cc.done).not.to.have.been.called;
          cc.next();
          expect(cc.done).to.have.been.calledOnce;
        });

        it('should execute the next callback w/ args and increment the pointer',
          function () {
            cc._callbacks[0] = sandbox.stub();
            sandbox.stub(cc, 'done');
            cc.next('foo');
            expect(cc._callbacks[0]).to.have.been.calledOnce;
            expect(cc._callbacks[0]).to.have.been.calledWith('foo');
            expect(cc._cb_idx).to.equal(1);
          });
      });

      describe('done()', function () {
        it('should reset the pointer', function () {
          cc._cb_idx = 1;
          cc.done();
          expect(cc._cb_idx).to.equal(0);
        });
      });

      describe('runner()', function () {
        it('should return a function which calls next', function () {
          var run = cc.runner();
          expect(run).to.be.a('function');
          sandbox.stub(cc, 'next');
          run('foo');
          expect(cc.next).to.have.been.calledWith('foo');
        });
      });

      describe('isChained()', function () {
        it('should tell us whether or not there are chained callbacks',
          function () {
            expect(cc.isChained()).to.be.false;
            cc._callbacks.push(angular.noop);
            expect(cc.isChained()).to.be.true;
          });
      });

      describe('chain()', function () {

        it('should add a function to the list of callbacks', function () {
          cc.chain(angular.noop);
          expect(cc._callbacks.length).to.equal(1);
        });

        it('should wrap the passed function within a call to next()',
          function () {
            var foo = sinon.stub().returnsArg(0);
            sandbox.spy(cc, 'next');
            sandbox.spy(cc, 'done');
            cc.chain(foo);
            cc.next('bar');
            expect(foo).to.have.been.calledOnce;
            expect(foo).to.have.been.calledWith('bar');
            expect(cc.next).to.have.been.calledWith('bar');
            expect(cc.next).to.have.been.calledTwice;
            expect(cc.done).to.have.been.calledOnce;


          });
      });


    });


  });
})();
