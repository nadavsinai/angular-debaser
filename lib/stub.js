(function (angular) {

  'use strict';

  angular.module('decipher.debaser').provider('decipher.debaser.stub',
    ['decipher.debaser.constants', function StubProvider($constants) {
      var Stub = function Stub(stub, opts) {
        angular.extend(this, stub);
        this.$opts = opts || {};
      };

      Stub.prototype.$debased = true;

      Stub.prototype.getStub = function getStub() {
        return this.$proxy;
      };

      Stub.prototype.provide = function provide($provide) {
        var fn,
            proxy = this.$proxy,
            inject = this.$opts.inject || [],
            provider;

        if (!angular.isFunction(proxy)) {
          provider = proxy;
          fn = this.$opts.provider ? 'constant' : 'value';
        } else {
          if (inject.length) {
            proxy.$inject = proxy.$inject || inject;
            proxy.$get = proxy.$get || angular.noop;
            if (this.$opts.provider) {
              // XXX: you will be SOL here if before version 1.x.x
              provider = ['$injector', function ($injector) {
                return function () {
                  return $injector.invoke(proxy);
                };
              }];
              fn = 'provider';
            }
            else {
              provider = ['$injector', function ($injector) {
                return function () {
                  return $injector.invoke(proxy);
                };
              }];
              fn = 'factory';
            }
          }
          else {
            provider = proxy;
            fn = this.$opts.provider ? 'constant' : 'value';
          }
        }

        $provide[fn](this.$name, provider);

      };

      Stub.findStub = function findStub(name, opts) {
        var stubs,
            adapter,
            ignores,
            stub,
            type,
            makeAdapterStub = function makeAdapterStub(stub_name) {
              if (adapter[stub_name]) {
                return new Stub({
                  $type: stub_name,
                  $name: name,
                  $proxy: adapter[stub]()
                });
              } else {
                throw new Error('Unknown stub type "' + stub_name + '".  Valid types are: ' +
                  $constants.STUB_TYPES.join(', '));
              }
            };

        opts = opts || {};
        stubs = opts.stubs;
        adapter = opts.adapter;
        ignores = opts.ignores || [];

        if (!name) {
          throw new Error('name is required');
        }

        if (!Object.keys(stubs).length) {
          throw new Error('define stubs!');
        }

        if (!adapter) {
          throw new Error('where the hell is the adapter?');
        }

        // if cached, then use it
        if (angular.isDefined(findStub.cache[name])) {
          return findStub.cache[name];
        }

        // no stub if this injectable is ignored
        if (ignores[name]) {
          return (findStub.cache[name] = null);
        }

        stub = stubs[name];
        if (stub) {
          // if the stub is a string, we try to see if the type is supported.
          if (angular.isString(stub)) {
            stub = makeAdapterStub(stub.toLowerCase());
          } else if (stub.$debased === true) {
            if (stub.$type) {
              stub.$proxy = stub.$proxy || adapter[stub.$type]();
            }
            stub.$name = stub.$name || name;
          } else if (angular.isFunction(stub) && stub.name && adapter[stub.name.toLowerCase()]) {
            stub = makeAdapterStub(stub.name.toLowerCase());
          } else {
            stub = new Stub({
              $name: name,
              $proxy: stub
            });
          }
          return (findStub.cache[name] = stub);
        }
      };
      Stub.findStub.cache = {};

      Stub.$get = this.$get = function $get() {
        throw new Error('not implemented');
      };

      angular.extend(this, {Stub: Stub});

      return Stub;
    }]);

})(window.angular);
