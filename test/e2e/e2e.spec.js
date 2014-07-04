(function (window) {
  'use strict';

  describe('e2e', function () {

    describe('methods', function () {

      var d;

      beforeEach(inject(function ($debaser) {
        d = new $debaser();
      }));

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
          expect(d.$$aspect.name).to.equal('module');
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

    describe.skip('chains', function () {
      var $provide,
          pairs = {},

          NUM = 20,

          SKIP = [
            'withDeps'
          ],

          choose = function choose(list) {
            var idx = Math.floor(Math.random() * list.length),
                item = list[idx];
            list.splice(idx, 1);
            return item;
          },

          chooseMethod = function chooseMethod(obj) {
            var methods = Object.keys(obj).filter(function (key) {
              return SKIP.indexOf(key) === -1 && key.charAt(0) !== '$' &&
                angular.isFunction(obj[key]);
            });
            return choose(methods);
          },

          chooseName = function chooseName() {
            return choose(names);
          },


          names = [
            'eyetooth',
            'pastoral',
            'bumble',
            'hover',
            'detainee',
            'canvas',
            'sector',
            'bayonet',
            'badmouth',
            'awakening',
            'heroes',
            'pragmatic',
            'figurehead',
            'profile',
            'plant',
            'dictator',
            'enjoy',
            'area',
            'beauty',
            'lightning'
          ],

          tests = {
            module: function testModule(name) {
              expect(angular.module).to.have.been.calledWith(name);
              expect(angular.mock.module).to.have.been.calledWith(name);
            },
            withDep: function testWithDep(name) {
              expect(angular.module).to.have.been.calledWith([name]);
            },
            func: function testFunc(name) {
              inject([name, function (stub) {
                expect($provide.value).to.have.been.calledWith(name);
                expect(stub).to.be.a('function');
                expect(stub()).to.be.undefined;
                expect(stub).to.have.been.calledOnce;
              }]);
            },
            object: function (name) {
              inject([name, function (stub) {
                expect($provide.value).to.have.been.calledWith(name);
                expect(stub).to.be.an('object');
              }]);
            }
          },

          debaser = window.debaser('chains');

      beforeEach(module(function (_$provide_) {
        $provide = _$provide_;
        sandbox.spy($provide, 'value');
        sandbox.spy($provide, 'constant');
      }));
      beforeEach(function () {
        sandbox.spy(angular, 'module');
        sandbox.spy(angular.mock, 'module');
        angular.forEach(pairs, function (method, name) {
          debaser[method](name);
        });
        debaser.debase();
      });

      var method,
          name;

      for (var i = 0; i < NUM; i++) {
        method = chooseMethod(debaser);
        name = chooseName(names);
        pairs[name] = method;
      }

      angular.forEach(pairs, function (method, name) {
        if (tests[method]) {
          it(method + '() should execute properly for "' + name + '"',
            function () {
              tests[method].call(this, name);
            }.bind(this));
        }
      }, this);

    });
  });

})(window);
