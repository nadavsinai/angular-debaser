(function (window, angular, sinon) {
  'use strict';

  angular.module('decipher.debaser')
    .provider('decipher.debaser.adapters.sinon', function SinonAdapterProvider() {

      var sandbox,
          addHook = function () {
            var args = arguments,
                stub;
            if (arguments.length === 1 && angular.isObject(arguments[0])) {
              stub = sinon.stub(angular.copy(arguments[0]));
            } else if (arguments.length === 1 && angular.isFunction(arguments[0])) {
              stub = sinon.spy(arguments[0]);
            } else {
              stub = sinon.stub.apply(null, [angular.copy(arguments[0])].concat(Array.prototype.slice.apply(arguments, [1])));
            }
            window.beforeEach(function (anon_stub) {
              return function () {
                var sb = sandbox || sinon.sandbox.create('decipher.debaser.adapters.sinon'),
                    i = args.length;
                while (i-- && i > 0) {
                  if (angular.isFunction(args[i].restore)) {
                    args[i].restore();
                  }
                }
                try {
                  stub = sb.stub.apply(sb, args);
                } catch (e) {
                  stub = sb.spy.apply(sb, args);
                }
                sinon.extend(stub, anon_stub);
              };
            }(stub));
            return stub;
          },
          newApply = function newApply(Constructor) {
            return function () {
              var Temp = function () {
                  },
                  instance,
                  retval;
              Temp.prototype = Constructor.prototype;
              instance = new Temp();
              retval = Constructor.apply(instance, arguments);
              return Object(retval) === retval ? retval : instance;
            };
          },
          sinonAdapter = function sinonAdapter() {
            window.beforeEach(function debaser_createSandbox() {
              sandbox = sinon.sandbox.create('decipher.debaser.adapters.sinon');
            });

            window.afterEach(function debaser_restoreSandbox() {
              sandbox && sandbox.restore();
            });

            return {
              'object': function (obj) {
                if (obj) {
                  return addHook(obj);
                }
                return {};
              },
              'function': function (fn) {
                return addHook.apply(null, arguments);
              },
              'array': function (arr) {
                if (arr) {
                  return arr.map(function (item, idx) {
                    return angular.isFunction(item) ? addHook.apply(null, [arr, idx]) : item;
                  });
                }
                return [];
              },
              'regexp': function () {
                var instance = newApply(RegExp)(arguments);
                addHook(null, instance);
                return instance;
              },
              'date': function () {
                var instance = newApply(Date)(arguments);
                addHook(null, instance);
                return instance;
              }
            };
          };

      sinonAdapter.$get = this.$get = function () {
        throw new Error('not implemented');
      };

      angular.extend(this, {sinonAdapter: sinonAdapter});

      this.adapter = function adapter() {
        return sinonAdapter();
      };

      return sinonAdapter;

    });

})(window, window.angular, window.sinon);
