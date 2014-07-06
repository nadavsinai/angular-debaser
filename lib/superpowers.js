(function (angular) {
  'use strict';

  angular.module('decipher.debaser').factory('decipher.debaser.superpowers',
    ['decipher.debaser.action', '$window', 'decipher.debaser.runConfig', '$log',
      function superpowersFactory(load, $window, $runConfig, $log) {

        var sinon = $window.sinon,
            SINON_EXCLUDE = [
              'create',
              'resetBehavior',
              'isPresent'
            ],

            // better way to do this?
            isSinon = function isSinon(value) {
              return value.displayName === 'stub' ||
                value.displayName === 'spy';
            },

            debaserConstantCallback = function debaserConstantCallback(module) {
              if (this.name && this.stub) {
                return module.constant(this.name, this.stub);
              }
            },

            module,
            withDep,
            withDeps,
            func,
            object,
            withFunc,
            withObject;

        module = function module(name, deps) {
          if (!name) {
            return $log('$debaser: ignoring empty call to module()');
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
          this.addAction({
            object: angular,
            func: 'module',
            args: [this.module, this.module_dependencies]
          });
          this.addAction({
            object: angular.mock,
            func: 'module',
            args: [this.module]
          });
          return load(this);
        };
        module.$aspect = ['base'];

        withDep = function withDep() {
          if (!arguments.length) {
            return $log('$debaser: ignoring empty call to withDep()');
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

        withDeps = function withDeps(arr) {
          if (!arr) {
            return $log('$debaser: ignoring empty call to withDeps()');
          }
          if (!angular.isArray(arr)) {
            throw new Error('$debaser: withDeps() expects an array');
          }
          withDep.apply(this, arr);
        };
        withDeps.$aspect = ['module'];

        func = function func(name) {
          var args = Array.prototype.slice.call(arguments, 1);
          if (!name) {
            return $log('$debaser: ignoring empty call to func()');
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

        object = function object(name, base) {
          if (!name) {
            return $log('$debaser: ignoring empty call to object()');
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

            this.provider = function provider($provide, $config) {
              var cfg = $config[provider._id];
              $provide[cfg.component](cfg.name, cfg.stub);
            };
            // angularjs hates to inject identical functions.
            // this makes them no longer identical.
            this.provider.toString = function toString() {
              return this._id.toString();
            }.bind(this);
            this.provider._id = this._id;
            this.provider.$inject = ['$provide', 'decipher.debaser.runConfig'];
            this.addAction(
              {
                object: angular.mock,
                func: 'module',
                args: [this.provider]
              }
            );
            $runConfig[this._id] = this;
            return load(this);
          }
        };
        object.$aspect = ['base'];

        // todo: add warnings here
        withFunc = function withFunc(name) {
          this.name = name;
          this.chain(debaserConstantCallback.bind(this));
          func.apply(this, arguments);
        };
        withFunc.$aspect = ['module'];

        withObject = function withObject(name) {
          this.name = name;
          this.chain(debaserConstantCallback.bind(this));
          object.apply(this, arguments);
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

          // exposed for testing
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
