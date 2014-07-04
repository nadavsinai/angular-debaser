(function (angular) {
  'use strict';

  angular.module('decipher.debaser').factory('$superpowers',
    ['$call', '$window', '$parse', function $superpowersFactory(call, $window, $parse) {

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
        var cfg = this.$$config();
        if (!name) {
          return console.warn('$debaser: ignoring empty call to module()');
        }
        if (!angular.isString(name)) {
          throw new Error('$debaser: module() expects a string');
        }
        cfg.module = name;
        cfg.module_dependencies = [];
        if (deps) {
          if (!angular.isArray(deps)) {
            throw new Error('$debaser: module() expects array or undefined as second parameter');
          }
          superpowers.withDeps.call(this, deps);
        }
        return call(cfg, {
          object: angular,
          func: 'module',
          args: ['module', 'module_dependencies']
        }, {
          object: angular.mock,
          func: 'module',
          args: ['module']
        });
      };
      module.$aspect = ['base'];

      var withDep = function withDep() {
        var cfg = this.$$config();
        if (!arguments.length) {
          return console.warn('$debaser: ignoring empty call to withDep()');
        }
        Array.prototype.slice.call(arguments).forEach(function (arg) {
          if (!angular.isString(arg)) {
            throw new Error('$debaser: withDep() expects one or more strings');
          }
        });
        cfg.module_dependencies.push.apply(cfg.module_dependencies,
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
        superpowers.withDep.apply(this, arr);
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
        return superpowers.object.call(this, name,
            sinon && sinon.stub ? sinon.stub.apply(sinon, args) : function debaserStub() {
          });
      };
      func.$aspect = ['base'];

      var object = function object(name, base) {
        var cfg = this.$$config();
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
        if (!cfg.stub) {
          if (!angular.isObject(base) && !angular.isFunction(base)) {
            base = {};
          }
          cfg.stub =
              sinon && sinon.stub && !isSinon(base) ? sinon.stub(base) : base;
        }
        if (!cfg.isChained()) {
          cfg.name = name;
          cfg.component = 'value';
          cfg.provider = function ($provide) {
            $provide[cfg.component](cfg.name, cfg.stub);
          };
          cfg.provider.$inject = ['$provide'];
          return call(cfg, {
            object: angular.mock,
            func: 'module',
            args: ['provider']
          });
        }
      };
      object.$aspect = ['base'];

      var withFunc = function withFunc(name) {
        var cfg = this.$$config();
        cfg.name = name;
        cfg.chain(debaserConstantCallback.bind(cfg));
        superpowers.func.apply(this, arguments);
      };
      withFunc.$aspect = ['module'];

      var withObject = function withObject(name) {
        var cfg = this.$$config();
        cfg.name = name;
        cfg.chain(debaserConstantCallback.bind(cfg));
        superpowers.object.apply(this, arguments);
      };
      withObject.$aspect = ['module'];

      var superpowers = {
        module: module,
        withDep: withDep,
        withDeps: withDeps,
        withFunc: withFunc,
        withObject: withObject,

        func: func,
        object: object,

        $SINON_EXCLUDE: SINON_EXCLUDE
      };

      angular.forEach(superpowers, function (fn, name) {
        if (!fn._name) {
          fn._name = name;
        }
      });

      if (sinon) {
        angular.forEach(sinon.stub, function (fn, name) {
          if (angular.isFunction(fn) && SINON_EXCLUDE.indexOf(name) === -1) {
            var sinonProxy = function sinonProxy() {
              var retval = fn.apply(this.$$config().stub, arguments);
              if (retval && retval.stub && retval.stub.func) {
                retval.end = function debaserEnd() {
                  return this;
                }.bind(this);
                return retval;
              }
            };
            sinonProxy.$aspect = ['func', 'withFunc'];
            sinonProxy._name = 'func';
            superpowers[name] = sinonProxy;
          }
        });
      }

      return superpowers;
    }]);

})(window.angular);
