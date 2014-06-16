/*! angular-debaser - v0.0.0 - 2014-06-16
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

      auto = angular.isDefined(opts.auto) ? opts.auto : $options.auto;
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
              stub.provide();
            }
          });
        }
      });
      debase._enabled = false;
    };
    moduleFunction.$inject =
      ['$provide', '$injector', 'decipher.debaser.utils', 'decipher.debaser.options',
        'decipher.debaser.stubProvider'];

    window.beforeEach(function () {
      angular.mock.module(moduleName, moduleFunction);
      window.inject();
    });

  };
  debase.options = function options(opts) {
    var global_opts = angular.injector(['decipher.debaser']).get('decipher.debaser.options');
    angular.extend(global_opts, opts);
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
      adapter: '$' + (sinon ? 'sinon' : 'vanilla') + 'Debaser',
      ignores: {},
      stubs: {},
      auto: false
    });


})(window.angular, window.beforeEach, window.sinon);

(function (angular) {
  'use strict';

  angular.module('decipher.debaser').provider('decipher.debaser.adapters.sinon', function () {

    //TODO implement

    this.$get = function () {
      throw new Error('not implemented');
    };

  });

})(window.angular);

(function (angular) {
  'use strict';

  angular.module('decipher.debaser')
    .provider('decipher.debaser.adapters.vanilla', function () {
      var isFloat = function isFloat(n) {
            var num = Number(n);
            return num | 0 === n;
          };

      //TODO: forget about this garbage and match sinon stub api
      return {
        'object': function (opts) {
          return new Object(opts);
        },
        'function': function (opts) {
          var prototype = opts.prototype,
              returns = opts.returns,
              returnsArg = opts.returnsArg,
              callsArg = opts.callsArg,
              callsArgWith = opts.callsArgParams,
              callsArgContext = opts.callsArgContext || null,
              context = opts.context || null,
              body = '';

          if (callsArg) {
            if (isFloat(callsArg) || isNaN(callsArg)) {
              throw new Error('callsArg must be an integer');
            }
            if (callsArgWith && !angular.isArray(callsArgWith)) {
              throw new Error('callsArgWith must be an array of parameters');
            }
            body += 'arguments[target].apply(callCtx, params);';
          }

          if (returnsArg) {
            if (isFloat(returnsArg) || isNaN(returnsArg)) {
              throw new Error('returnsArg must be an integer');
            }
            body += 'return arguments[identity];';
          }
          else if (returns) {
            body += 'return retval;';
          }

          return function (body, ctx, target, callCtx, params, identity, retval,
            prototype) {
            var fn = new Function(body).bind(ctx);
            if (prototype) {
              fn.prototype = Object.create(prototype);
            }
            return fn;
          }(body, context, callsArg, callsArgContext, callsArgWith || [],
            returnsArg, returns, prototype);
        },
        'array': function () {
          if (arguments.length === 0) {
            return [];
          }
          return Array.prototype.slice.apply(arguments);
        },
        'regexp': function () {
          return new RegExp();
        },
        'date': function () {
          return new Date();
        },
        $get: function () {
          throw new Error('not implemented');
        }

      };

    });

})(window.angular);

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

(function (angular) {
  'use strict';

  var contains,
      makeSet,
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
    if (getAdapter.cache[name]) {
      return getAdapter.cache[name];
    }
    if (!angular.isString(name)) {
      return (getAdapter.cache[name] = name);
    }
    try {
      return (getAdapter.cache[name] = angular.injector(['decipher.debaser']).get(name));
    } catch (e) {
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

(function(angular, debase) {
  'use strict';

  angular.module('decipher.debaser').config(['$injector', 'decipher.debaser.utils', 'decipher.debaser.constants',
      'decipher.debaser.stubProvider', 'decipher.debaser.options',
      function ($injector, utils, constants, Stub, global_opts) {
        debase.stub = function stub(type, opts) {
          var STUB_TYPES = constants.STUB_TYPES,
              contains = utils.contains;

          opts = angular.extend({}, global_opts, opts);
          if (!type) {
            throw new Error('Parameter required');
          }
          if (angular.isString(type)) {
            type = type.toLowerCase();
            if (!contains(STUB_TYPES, type)) {
              throw new Error('Unknown stub type "' + type + '".  Valid types are: ' +
                STUB_TYPES.join(', ') + '. To use a custom value, do not use this function.');
            }
            return new Stub({
              $type: type
            }, opts);
          }
          return new Stub({
            $proxy: type.bind(opts.context || null)
          }, opts);
        };
        debase._enabled = true;
      }]);
})(window.angular, window.debase);

(function (angular, beforeEach) {
  'use strict';
  beforeEach(angular.mock.module('decipher.debaser'));
})(window.angular, window.beforeEach);
