/*! angular-debaser - v0.1.0 - 2014-06-17
* https://github.com/decipherinc/angular-debaser
* Copyright (c) 2014 Decipher, Inc.; Licensed MIT */
(function (window, angular) {
  'use strict';

  var injector = angular.injector,
      isArray = angular.isArray,
      extend = angular.extend,

      debase;

  debase = function debase(moduleName, targets, opts) {
    var ignores,
        auto,
        stubs,
        moduleFunction;

    if (!moduleName) {
      throw new Error('debase requires a module name parameter');
    }

    if (!targets || (isArray(targets) && !targets.length)) {
      throw new Error('debase requires one or more target components');
    }

    if (angular.isString(targets)) {
      targets = [targets];
    }

    opts = opts || {};
    moduleFunction = function moduleFunction($provide, $injector, $utils, $options, Stub) {
      var adapter = $utils.getAdapter(opts.adapter || $options.adapter),
          contains = $utils.contains;

      Stub = angular.isObject(Stub) ? Stub.Stub : Stub;
      auto = angular.isDefined(opts.autoStub) ? opts.autoStub : $options.autoStub;
      stubs = extend({}, $options.stubs, opts.stubs);
      ignores = extend({}, $options.ignores, $utils.makeSet(opts.ignores || []));
      angular.module(moduleName)._invokeQueue.forEach(function (item) {
        var component_type = item[1],
            definition = item[2],
            name = definition[0],
            annotations;
        if (contains(targets, name)) {
          //TODO support $inject
          annotations = isArray(definition[1]) ? definition[1].slice(0, -1)
            : injector().annotate(definition[1]);
          annotations.forEach(function (name) {
            var stub;
            if (auto && !stubs[name]) {
              stubs[name] = new Stub({
                $name: name,
                $type: 'function'
              });
            }
            stub = Stub.findStub(name, {
              stubs: stubs,
              adapter: adapter,
              ignores: ignores
            });
            if (stub) {
              stub.provide($provide);
            }
          });
        }
      });

    };
    moduleFunction.$inject =
      ['$provide', '$injector', 'decipher.debaser.utils', 'decipher.debaser.options',
        'decipher.debaser.stubProvider'];

    window.beforeEach(function () {
      angular.mock.module(moduleName, moduleFunction);
    });

  };
  debase.options = function options(opts) {
    var global_opts = angular.injector(['decipher.debaser']).get('decipher.debaser.options');
    angular.extend(global_opts, opts);
  };

  debase.stub = function stub(type, value, opts) {
    var new_stub,
        getBase = function getBase(stub) {
          return function base() {
            return stub;
          };
        },
        stubber = function (global_opts, constants, utils, Stub) {
          var STUB_TYPES = constants.STUB_TYPES,
              adapter,
              proxy;

          Stub = angular.isObject(Stub) ? Stub.Stub : Stub;
          if (!type) {
            throw new Error('Parameter required');
          }
          if (angular.isString(type)) {
            type = type.toLowerCase();
            if (!utils.contains(STUB_TYPES, type)) {
              throw new Error('Unknown stub type "' + type + '".  Valid types are: ' +
                STUB_TYPES.join(', ') + '. To use a custom value, do not use this function.');
            }
            adapter = utils.getAdapter(opts.adapter || global_opts.adapter);
            proxy = adapter[type](value);
            new_stub = new Stub({
              $type: type,
              $proxy: proxy
            }, opts);

            if (angular.isObject(proxy) || angular.isArray(proxy)) {
              angular.forEach(new_stub.$proxy, function (value) {
                if (angular.isFunction(value)) {
                  value.base = getBase(new_stub);
                }
              });
            } else if (angular.isFunction(proxy)) {
              proxy.base = getBase(new_stub);
            }
          } else {
            new_stub = new Stub(angular.extend({}, type, {
              $proxy: type
            }), opts);
          }

        };
    opts = opts || {};
    stubber.$inject =
      ['decipher.debaser.options', 'decipher.debaser.constants', 'decipher.debaser.utils',
        'decipher.debaser.stubProvider', '$injector'];

    angular.injector(['decipher.debaser', stubber]);

    return new_stub;
  };

  window.debase = debase;

})(window, window.angular);

(function (angular, beforeEach, sinon) {
  'use strict';

  var STUB_TYPES = [
        'function',
        'object',
        'array',
        'regexp',
        'date'
      ],
      COMPONENTS = [
        'factory',
        'service',
        'provider'
      ];

  angular.module('decipher.debaser', ['ngMock'])
    .constant('decipher.debaser.constants', {
      STUB_TYPES: STUB_TYPES,
      COMPONENTS: COMPONENTS
    })
    .constant('decipher.debaser.options', {
      adapter: 'decipher.debaser.adapters.sinon',
      ignores: {},
      stubs: {},
      autoStub: false,
      autoScope: true
    });


})(window.angular, window.beforeEach, window.sinon);

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

(function (angular) {
  'use strict';

  var contains,
      makeSet,
      config,
      getAdapter;

  contains = function contains(collection, member) {
    return collection.indexOf(member) > -1;
  };

  makeSet = function makeSet(arr) {
    var o = {};
    arr.forEach(function (item) {
      if (angular.isString(item)) {
        o[item] = true;
      }
    });
    return o;
  };


  getAdapter = function getAdapter(name) {
    var adapter,
        _getAdapter = function($adapter) {
            adapter = angular.isObject($adapter) ? $adapter.adapter() : $adapter();
        };
      _getAdapter.$inject = [name + 'Provider'];
    if (getAdapter.cache[name]) {
      return getAdapter.cache[name];
    }
    if (!angular.isString(name)) {
      return (getAdapter.cache[name] = name);
    }
    try {
      angular.injector(['decipher.debaser', _getAdapter]);
      return (getAdapter.cache[name] = adapter);
    } catch (e) {
      window.console.error(e.message);
      window.console.error(e.stack);
      window.console.error(e);
      throw new Error('debaser: unknown adapter "' + name + '"');
    }
  };
  getAdapter.cache = {};

  angular.module('decipher.debaser').constant('decipher.debaser.utils', {
    getAdapter: getAdapter,
    makeSet: makeSet,
    contains: contains
  });
})(window.angular);

(function (angular) {
  'use strict';

  angular.module('decipher.debaser').config(['$injector', 'decipher.debaser.options', '$provide',
    function ($injector, global_opts, $provide) {

      if (global_opts.autoScope) {
        $provide.decorator('$controller', function ($delegate, $injector) {
          var $rootScope = $injector.get('$rootScope');
          return function (name, locals) {
            var instance;
            locals = locals || {};
            locals.$scope = locals.$scope || $rootScope.$new();
            instance = $delegate(name, locals);
            instance.scope = function scope() {
              return locals.$scope;
            };
            return instance;
          };
        });
      }

      $provide.decorator('decipher.debaser.stub', function ($delegate) {
        return angular.isObject($delegate) ? $delegate.Stub : $delegate;
      });
      $provide.decorator('decipher.debaser.adapters.sinon', function ($delegate) {
        return angular.isObject($delegate) ? $delegate.sinonAdapter : $delegate;
      });



      }]);
})(window.angular);

(function (angular, beforeEach) {
  'use strict';
  beforeEach(angular.mock.module('decipher.debaser'));
})(window.angular, window.beforeEach);
