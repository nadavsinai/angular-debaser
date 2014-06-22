(function (window) {

  'use strict';

  var module = window.angular.mock.module,
      inject = window.angular.mock.inject,
      sandbox;

  beforeEach(function () {
    sandbox = sinon.sandbox.create('debaser');
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('debaser', function () {

    var debaser = window.debaser;

    afterEach(function () {
      debaser.$$debasers = {};
    });

    describe('window.debaser()', function () {

      it('should exist', function () {
        expect(debaser).to.be.a('function');
      });

      it('should expose a $$debasers object', function () {
        expect(debaser.$$debasers).to.be.an('object');
      });

      it('should register a singleton Debaser object', function () {
        var injector, d;
        d = debaser();
        injector = d.$injector();

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
        expect(d.name).to.equal('foo') &&
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


    describe('Debaser', function () {

      describe('constructor', function () {

        var Debaser;

        beforeEach(module(function ($provide) {
          $provide.constant('decipher.debaser.options', {});
        }, 'decipher.debaser'));

        beforeEach(inject(function ($debaser) {
          Debaser = $debaser;
          sandbox.stub($debaser.prototype, '$aspect');
        }));

        it('should set defaults & call $aspect()', function () {
          var d = new Debaser();
          expect(d.name).to.be.undefined;
          expect(d.$queue).to.eql([]);
          expect(d.$aspect).to.have.been.calledOnce;
          expect(d.$aspect).to.have.been.calledWith('base');
        });
      });

      describe('chainable methods', function () {

        var d;

        beforeEach(function () {
          d = debaser();
        });

        describe('module()', function () {

          it('should throw if invalid parameters', function () {
            var err = '$debaser: module() expects a string or array of strings (module names)';
            expect(function () {
              d.module();
            }).to.throw(err);
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

          it('should accept an array of strings', function () {
            expect(function () {
              d.module(['foo', 'bar']);
            }).not.to.throw();
          });

          it('should return a Debaser', function () {
            expect(d.module('foo')).to.equal(d);
          });

          it('should enqueue in the aspect', function () {
            var item;
            d.module('foo');
            expect(d.$$aspect.$invokeQueue.length).to.equal(2);
            item = d.$$aspect.$invokeQueue[0];
            expect(item).to.be.an('object');
            expect(item.object).to.equal(window.angular);
            expect(item.fn_name).to.equal('module');
            expect(item.args).to.eql(['foo', []]);
            expect(item.ctx).to.equal(window.angular);
            item = d.$$aspect.$invokeQueue[1];
            expect(item).to.be.an('object');
            expect(item.object).to.equal(window.angular.mock);
            expect(item.fn_name).to.equal('module');
            expect(item.args).to.eql(['foo']);
            expect(item.ctx).to.equal(window.angular.mock);
          });

          it('should create a fake module upon debase()', function () {
            sandbox.stub(window.angular, 'module');
            sandbox.stub(window.angular.mock, 'module');
            d.module('foo').debase();
            console.log(window.angular.module.getCalls());
            expect(window.angular.module).to.have.been.calledWith('foo', []);
            expect(window.angular.mock.module).to.have.been.calledWith('foo');
          });

          it('should set the aspect to be "module"', function () {
            d.module('foo');
            expect(d.$$aspect_name).to.equal('module');
            expect(d.$$aspect).to.be.an('object');
            expect(d.module).to.be.a('function');
          });
        });

      });

      describe('debase()', function () {

        var d;

        beforeEach(function () {
          d = debaser();
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
      });
    });

  });

  describe('e2e', function () {
    angular.module('bar', ['foo'])
      .value('baz', 'quux');
    window.debaser()
      .module('foo');

    beforeEach(window.debase);
    beforeEach(module('bar'));

    it('should provide dependencies for module "bar"', inject(function (baz) {
      expect(baz).to.equal('quux');
    }));

  });

})(window);
