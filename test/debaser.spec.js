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
        Aspect = $aspect();
      }));

      it('should shift aspects', function () {
        var fn = angular.noop,
            prevAspect = d.$$aspect,
            stub_proto = sandbox.stub().returns({});
        sandbox.stub(d.$Aspect, 'create').returns({
          proto: stub_proto
        });
        sandbox.spy(prevAspect, 'name');
        sandbox.stub(prevAspect, 'proto');
        sandbox.stub(d, '$enqueue');

        prevAspect.behavior().push(fn);
        d.$aspect('module');
        expect(d.$Aspect.create).to.have.been.calledOnce;
        expect(d.$Aspect.create).to.have.been.calledWith('module', prevAspect);
        expect(prevAspect.name).to.have.been.calledOnce;
        expect(prevAspect.proto).not.to.have.been.called;
        expect(d.$enqueue).not.to.have.been.called;
        expect(stub_proto).to.have.been.calledOnce;
        expect(d.$$aspect).to.eql({
          proto: stub_proto
        });

      });

    });

    describe('chainable methods', function () {

      var d;

      beforeEach(function () {
        d = new Debaser();
      });

      it('should always return a Debaser', function () {
        Object.keys(d).filter(function (key) {
          return key.charAt(0) !== '$';
        }).forEach(function (name) {
          expect(d[name]()).to.equal(d);
        });
      });

      describe('module()', function () {

        it('should throw if invalid parameters', function () {
          var err = '$debaser: module() expects a string';
          expect(function () {
            d.module();
          }).not.to.throw();
          expect(function () {
            d.module({herp: 'derp'});
          }).to.throw(err);
          expect(function () {
            d.module([1, 2, 3]);
          }).to.throw(err);
        });

        it('should accept a string', function () {
          expect(function () {
            d.module('foo');
          }).not.to.throw();
        });

        it('should create a fake module upon debase()', function () {
          sandbox.stub(angular, 'module');
          sandbox.stub(angular.mock, 'module');
          d.module('foo');
          expect(d.module).to.be.a('function');
          d.debase();
          expect(angular.module).to.have.been.calledWith('foo', []);
          expect(angular.mock.module).to.have.been.calledWith('foo');
        });

        it('should set the aspect to "module"', function () {
          d.module('foo');
          expect(d.$$aspect.name()).to.equal('module');
          expect(d.module).to.be.a('function');
          expect(d.withDep).to.be.a('function');
          expect(d.withDeps).to.be.a('function');
        });

      });

      describe('withDep', function () {
        it('should throw if invalid arguments', function () {
          expect(function () {
            d.module('foo').withDep();
          }).not.to.throw();
          expect(function () {
            d.module('foo').withDep({});
          }).to.throw('$debaser: withDep() expects one or more strings');
        });
        it('should accept a string', function () {
          expect(function () {
            d.module('foo').withDep('bar');
          }).not.to.throw();
        });
        it('should create a fake module with a dependency upon debase()',
          function () {
            sandbox.stub(angular, 'module');
            sandbox.stub(angular.mock, 'module');
            d.module('foo').withDep('bar');
            expect(d.withDep).to.be.a('function');
            d.debase();
            expect(angular.module).to.have.been.calledWith('foo',
              ['bar']);
            expect(angular.mock.module).to.have.been.calledWith('foo');
          });
      });


      describe('withDeps', function () {
        it('should throw if invalid arguments', function () {
          expect(function () {
            d.module('foo').withDeps();
          }).not.to.throw();
          expect(function () {
            d.module('foo').withDeps({});
          }).to.throw('$debaser: withDeps() expects an array');
        });
        it('should accept an array', function () {
          expect(function () {
            d.module('foo').withDeps(['bar']);
          }).not.to.throw();
        });
        it('should create a fake module with a dependency upon debase()',
          function () {
            sandbox.stub(angular, 'module');
            sandbox.stub(angular.mock, 'module');
            d.module('foo').withDeps(['bar']);
            expect(d.withDeps).to.be.a('function');
            d.debase();
            expect(angular.module).to.have.been.calledWith('foo',
              ['bar']);
            expect(angular.mock.module).to.have.been.calledWith('foo');
          });
      });

      describe('func()', function () {
        it('should make a value upon debase()', function () {          
          sandbox.stub(angular.mock, 'module');
          d.func('foo');
          expect(d.func).to.be.a('function');
          expect(d.withDep).to.be.undefined;
          d.debase();
          expect(angular.mock.module).to.have.been.calledOnce;
        });
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
          expect(d.$$aspect.$name).to.equal('module');
          queue = d.$queue;
          expect(queue.length).to.equal(0);
          sandbox.spy(queue, 'forEach');
          d.debase();
          expect(queue.forEach).to.have.been.calledOnce;
          expect(d.$queue.length).to.equal(2);
          expect(d.$aspect).to.have.been.calledTwice;
          expect(d.$aspect).to.have.been.calledWith('base');
          expect(d.$$aspect.$name).to.equal('base');
        });
    });
  });

})(window);
