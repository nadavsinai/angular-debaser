'use strict';

/**
 * @todo split me up
 */
angular.module('decipher.debaser').factory('decipher.debaser.superpowers',
  ['decipher.debaser.loadAction', '$window', 'decipher.debaser.runConfig', '$log',
    'decipher.debaser.options',
    function superpowersFactory(loadAction, $window, $runConfig, $log, options) {

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
            if (this.name && this.stub && module && module.constant) {
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
        var real_module, i;
        if (!name) {
          name = 'dummy-' + module.$id++;
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
        try {
          real_module = angular.module(name);
          if (options.skipConfigs && real_module) {
            i = real_module._invokeQueue.length;
            while (i--) {
              if (real_module._invokeQueue[i][0] === '$injector' &&
                real_module._invokeQueue[i][1] === 'invoke') {
                real_module._invokeQueue.splice(i, 1);
              }
            }
          }
        }
        catch (e) {
        }
        this.addAction({
          object: angular,
          func: 'module',
          args: !real_module ? [this.module, this.module_dependencies] : [this.module]
        });
        this.addAction({
          object: angular.mock,
          func: 'module',
          args: [this.module]
        });
        return loadAction(this);
      };
      module.$aspect = ['base'];
      module.$id = 0;

      withDep = function withDep() {
        if (!arguments.length) {
          return $log.debug('$debaser: ignoring empty call to withDep()');
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
          return $log.debug('$debaser: ignoring empty call to withDeps()');
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
          return $log.debug('$debaser: ignoring empty call to func()');
        }
        if (!angular.isString(name)) {
          throw new Error('$debaser: func() expects a name');
        }
        this.func = sinon && sinon.stub ? sinon.stub.apply(sinon, args) :
          function debaserStub() {
          };
        return object.call(this, name, this.func);
      };
      func.$aspect = ['base'];

      object = function object(name, base) {
        if (!name) {
          return $log.debug('$debaser: ignoring empty call to object()');
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
          if (angular.isObject(base)) {
            this.stub =
                sinon && sinon.stub && !isSinon(base) ? sinon.stub(base) :
              base;
          } else {
            this.stub = base;
          }
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
            return 'debaserProvider-' + this._id.toString();
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
          return loadAction(this);
        }
      };
      object.$aspect = ['base'];

      // todo: add warnings here
      withFunc = function withFunc(name) {
        var args = Array.prototype.slice.call(arguments, 1);
        if (angular.isObject(this.stub)) {
          this.func = sinon && sinon.stub ? sinon.stub.apply(sinon, args) :
            function debaserStub() {
            };
          this.stub[name] = this.func;
        } else {
          this.name = name;
          this.chain(debaserConstantCallback.bind(this));
          func.apply(this, arguments);
        }
      };
      withFunc.$aspect = ['module', 'object', 'withObject'];

      withObject = function withObject(name) {
        this.name = name;
        this.chain(debaserConstantCallback.bind(this));
        object.apply(this, arguments);
      };
      withObject.$aspect = ['module'];

      var superpowers = {
        func: func,
        module: module,
        object: object,
        withDep: withDep,
        withDeps: withDeps,
        withFunc: withFunc,
        withObject: withObject,

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
              var retval = fn.apply(this.func, arguments);
              if (retval && retval.stub && retval.stub.func) {
                retval.end = function debaserEnd() {
                  return this;
                }.bind(this);
                return retval;
              }
            };
            sinonProxy.$aspect = ['func', 'withFunc'];
            superpowers[name] = sinonProxy;
          }
        });
      }

      return superpowers;
    }]);
