(function () {
  'use strict';

  /**
   * @todo improve this test to execute stuff not in "base" aspect
   */
  describe('e2e', function () {
    describe('random chain', function () {
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
                expect($provide.provider).to.have.been.calledWith(name);
                expect(stub).to.be.an('object');
              }]);
            }
          },

          debaser = window.debaser('random');

      angular.forEach(tests, function (fn) {
        fn.expectedCallCount = 0;
      });

      beforeEach(module(function (_$provide_) {
        $provide = _$provide_;
        sandbox.spy($provide, 'value');
        sandbox.spy($provide, 'provider');
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
      afterEach(function () {
        angular.forEach(tests, function (fn) {
          fn.expectedCallCount = 0;
        });
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
            });
        }
      }, this);

    });
  });
})();
