(function (angular) {
  'use strict';

  angular.module('decipher.debaser').factory('$superpowers',
    ['$call', '$window', function $superpowersFactory(call, $window) {

      var SINON_EXCLUDE = [
        'create',
        'resetBehavior',
        'isPresent'
      ];

      var sinon = $window.sinon,
          console = $window.console;

      var isSinon = function isSinon(value) {
        return value.displayName === 'stub' || value.displayName === 'spy';
      };

      var debaserConstantCallback = function debaserConstantCallback(module) {
        if (this.name && this.stub) {
          return module.constant(this.name, this.stub);
        }
      };

      var module = function module(name, deps) {
        if (!name) {
          return console.warn('$debaser: ignoring empty call to module()');
          }
        if (!angular.isString(name)) {
          throw new Error('$debaser: module() expects a string');
        }
        this.module = name;
        this.module_dependencies = [];
        if (deps) {
          if (!angular.isArray(deps)) {
            throw new Error('$debaser: module() expects array or undefined as second parameter');
          }
          superpowers.withDeps.call(this, deps);
        }
        this.addCall({
          object: angular,
          func: 'module',
          args: [this.module, this.module_dependencies]
        });
        this.addCall({
          object: angular.mock,
          func: 'module',
          args: [this.module]
        });
        return call(this);
      };
      module.$aspect = ['base'];

      var withDep = function withDep() {
        if (!arguments.length) {
          return console.warn('$debaser: ignoring empty call to withDep()');
          }
        Array.prototype.slice.call(arguments).forEach(function (arg) {
          if (!angular.isString(arg)) {
            throw new Error('$debaser: withDep() expects one or more strings');
          }
        });
        this.module_dependencies.push.apply(this.module_dependencies,
          arguments);
      };
      withDep.$aspect = ['module'];

      var withDeps = function withDeps(arr) {
        if (!arr) {
          return console.warn('$debaser: ignoring empty call to withDeps()');
        }
        if (!angular.isArray(arr)) {
          throw new Error('$debaser: withDeps() expects an array');
        }
        withDep.apply(this, arr);
      };
      withDeps.$aspect = ['module'];

      var func = function func(name) {
        var args = Array.prototype.slice.call(arguments, 1);
        if (!name) {
          return console.warn('$debaser: ignoring empty call to func()');
        }
        if (!angular.isString(name)) {
          throw new Error('$debaser: func() expects a name');
        }
        return object.call(this, name,
            sinon && sinon.stub ? sinon.stub.apply(sinon, args) :
            function debaserStub() {
            });
      };
      func.$aspect = ['base'];

      var object = function object(name, base) {
        if (!name) {
          return console.warn('$debaser: ignoring empty call to object()');
          }
        if (!angular.isString(name)) {
          throw new Error('$debaser: object() expects a name');
        }
        if (base && !angular.isFunction(base) && !angular.isObject(base)) {
          throw new Error('$debaser: object() second param should be an ' +
            'Object or undefined');
        }
        if (!this.stub) {
          if (!angular.isObject(base) && !angular.isFunction(base)) {
            base = {};
          }
          this.stub =
              sinon && sinon.stub && !isSinon(base) ? sinon.stub(base) : base;
        }
        if (!this.isChained()) {
          this.name = name;
          this.component = 'value';
          this.provider = function ($provide) {
            $provide[this.component](this.name, this.stub);
          };
          this.addCall(
            {
              object: angular.mock,
              func: 'module',
              args: [this.provider]
            }
          );
          return call(this);
        }
      };
      object.$aspect = ['base'];

      var withFunc = function withFunc(name) {
        this.name = name;
        this.chain(debaserConstantCallback.bind(this));
        func.apply(this, arguments);
      };
      withFunc.$aspect = ['module'];

      var withObject = function withObject(name) {
        this.name = name;
        this.chain(debaserConstantCallback.bind(this));
        object.apply(this, arguments);
      };
      withObject.$aspect = ['module'];

      var wrap = function wrap(fn) {
        var debaserConfigProxy = function debaserConfigProxy(cfg) {
          return fn.bind(cfg);
        };
        debaserConfigProxy.$aspect = fn.$aspect;
        debaserConfigProxy.$name = fn.$name;
        return debaserConfigProxy;
      };

      var superpowers = {
        module: wrap(module),
        withDep: wrap(withDep),
        withDeps: wrap(withDeps),
        withFunc: wrap(withFunc),
        withObject: wrap(withObject),

        func: wrap(func),
        object: wrap(object),

        $SINON_EXCLUDE: SINON_EXCLUDE
      };

      angular.forEach(superpowers, function (fn, name) {
        if (!fn.$name) {
          fn.$name = name;
          }
        });

      if (sinon) {
        angular.forEach(sinon.stub, function (fn, name) {
          if (angular.isFunction(fn) && SINON_EXCLUDE.indexOf(name) === -1) {
            var sinonProxy = function sinonProxy() {
              var retval = fn.apply(this.stub, arguments);
              if (retval && retval.stub && retval.stub.func) {
                retval.end = function debaserEnd() {
                  return this;
                }.bind(this);
                return retval;
              }
            };
            sinonProxy.$aspect = ['func', 'withFunc'];
            sinonProxy.$name = 'func';
            superpowers[name] = sinonProxy;
          }
        });
      }

      return superpowers;
    }]);

})(window.angular);
