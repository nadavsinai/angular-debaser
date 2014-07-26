'use strict';

/**
 * @todo split me up
 */
angular.module('decipher.debaser').factory('debaserSuperpowers',
  ['debaserLoadAction', '$window', 'debaserRunConfig', '$log',
    'debaserOptions',
    function superpowersFactory(loadAction, $window, $runConfig, $log, options) {

      /**
       * @external sinon.stub
       * @description A stub function.  (Almost) all functions available to Sinon.JS stubs.
       * @see http://sinonjs.org/docs/#stubs
       * @mixin sinon.stub
       */

      /**
       * @external sinon.Stub
       * @description 
       * A Stub object.  Returned when using an `*onCall*` method, instead of a {@link sinon.stub stub}.  In this context, use {@link sinon.Stub.end end()} to return to a {@link Debaser} instance. 
       * > The `create()`, `resetBehavior()` and `isPresent()` functions of the Sinon.JS "stub" API are not used.  If someone needs these, please {@link https://github.com/decipherinc/angular-debaser/issues/ create an issue} and provide a use case.
       * @mixin sinon.Stub
       */
      
      /**
       * @namespace base
       * @mixin
       */

      /**
       * @namespace module
       * @memberof base
       * @mixin
       * @mixes base.object
       */

      /**
       * @namespace func
       * @memberof base
       * @mixin
       * @mixes sinon.stub
       */
      
      /**
       * @namespace object
       * @memberof base
       * @mixin       
       */

      /**
       * @namespace withObject
       * @memberof base.module
       * @mixes base.object
       * @mixin
       */
      
      /**
       * @namespace withFunc
       * @memberof base.module
       * @mixes base.func
       * @mixin
       */

      /**
       * @typedef {function} Action
       * @summary A method (on a {@link Debaser} instance) which tells angular-debaser to provide some object, method, function, etc.
       * @description These functions will always return {@link Debaser} instances, however, the mixins used will change.  The "root" mixin is the {@link base} mixin.  All other mixins "inherit" from this one, meaning the {@link base} methods *will always be available*.
       * @example
       * debaser
       *   .object('Foo') // we are now in the `base.object` mixin.
       *   .withFunc('bar') // we are now in the `base.withFunc` mixin.
       *   // however, since these mixins are inherited, we always have access to 
       *   // method `object`, which is on the `base` mixin.
       *   .object('Baz')
       *   .debase(); // go!
       *   // `Foo` and `Baz` are now injectable; `Foo` has a static function `bar`
       *   
       */
        
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

      /**
       * @memberof base
       * @instance
       * @description Stubs a module, or bootstraps an existing module.    
       * @param {string} name Module name to bootstrap/stub.
       * @param {Array<String>} [deps] Any dependencies of this module.
       * @returns {base.module}
       * @see Action
       */
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

      /**
       * @description Adds dependencies to the current module.  Potentially useful if you have a dependency chain `A -> B -> C` and you wish to stub `B` but not `A` or `C`.
       * @param {...string} dep Module dependency
       * @memberof base.module
       * @instance
       * @returns {base.module}
       * @see Action
       */
      withDep = function withDep(dep) {
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

      /**
       * @description Like {@link base.module.withDep withDep}, but accepts an array instead.
       * @param {Array<String>} arr Array of module dependencies
       * @memberof base.module
       * @instance
       * @returns {base.module}
       * @see Action
       */
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

      /**
       * @description Creates an injectable function.
       * @param {string} name Name of injectable
       * @memberof base
       * @instance
       * @returns {base.func}
       * @see Action
       */
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

      /**
       * @description Creates an injectable object.
       * @param {string} name Name of injectable
       * @param {Object} [base] If supplied, will inject this object instead.  If {@link http://sinonjs.org Sinon.JS) is present, the object's functions will be spied upon.
       * @memberof base
       * @instance
       * @returns {base.object}
       * @see Action
       */      
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
          this.provider.$inject = ['$provide', 'debaserRunConfig'];
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

      /**
       * @description Provides a function on the object, or injectable function on the module.  If used in a module context, then provides a constant.  If {@link http://sinonjs.org Sinon.JS} is present, 
       * @memberof base.object
       * @instance
       * @param {string} name Name of member function or injectable function
       * @returns {(base.object|base.module|base.module.withObject)}
       * @see Action
       */
      withFunc = function withFunc(name) {
        // todo: add warnings here
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

      /**
       * @description Provides a *constant* injectable object on the module.
       * @param {string} name Name of injectable object
       * @see Action
       */
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
                /**
                 * @description Gives you a {@link Debaser} instance back if you have been setting things up via `*onCall*` methods.
                 * @function sinon.Stub#end
                 * @returns {(base.func|base.module.withFunc)}
                 */
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
