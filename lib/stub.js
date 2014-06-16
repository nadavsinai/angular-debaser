(function (angular) {

  'use strict';

  angular.module('decipher.debaser').provider('decipher.debaser.stub',
    ['$provide', 'decipher.debaser.constants', function StubProvider($provide, $constants) {
      var Stub = function Stub(stub, opts) {
        angular.extend(this, stub);
        this.$opts = opts || {};
      };

      Stub.prototype.initProp = function initProp(prop, val) {
        if (angular.isUndefined(this[prop])) {
          this[prop] = val;
        }
      };

      //TODO unify this and findStub?
      Stub.prototype.provide = function provide() {
        var fn = this.$opts.provider ? 'constant' : 'value';
        $provide[fn](this.$name, this.$proxy);
      };

      Stub.findStub = function findStub(name, opts) {
        var stubs,
            adapter,
            ignores,
            stub,
            type;

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
            stub = stub.toLowerCase();
            if (adapter[stub]) {
              stub = new Stub({
                $type: stub,
                $name: name,
                $proxy: adapter[stub]()
              });
            } else {
              throw new Error('Unknown stub type "' + stub + '".  Valid types are: ' +
                $constants.STUB_TYPES.join(', '));
            }
          } else if (stub.constructor === Stub) {
            if (stub.$type) {
              stub.initProp('$proxy', adapter[stub.$type](stub.$opts));
            }
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

      Stub.$get = function $get() {
        throw new Error('not implemented');
      };

      return Stub;
    }]);

})(window.angular);
