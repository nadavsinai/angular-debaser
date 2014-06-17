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
              stub.provide();
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
      angular.mock.inject();
    });

  };
  debase.options = function options(opts) {
    var global_opts = angular.injector(['decipher.debaser']).get('decipher.debaser.options');
    angular.extend(global_opts, opts);
  };

  debase.stub = function stub(type) {
    var new_stub,
        args = arguments,
        getBase = function getBase(stub) {
          return function base() {
            return stub;
          };
        },
        stubber = function (global_opts, constants, utils, Stub, $injector) {
          var STUB_TYPES = constants.STUB_TYPES,
              adapter,
              proxy;

          if (!type) {
            throw new Error('Parameter required');
          }
          if (angular.isString(type)) {
            type = type.toLowerCase();
            if (!utils.contains(STUB_TYPES, type)) {
              throw new Error('Unknown stub type "' + type + '".  Valid types are: ' +
                STUB_TYPES.join(', ') + '. To use a custom value, do not use this function.');
            }
            adapter = utils.getAdapter(global_opts.adapter, $injector);
            proxy = adapter[type].apply(null, Array.prototype.slice.call(args, 1));
            new_stub = new Stub(angular.extend({}, proxy, {
              $type: type,
              $proxy: proxy
            }));

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
            }));
          }

        };
    stubber.$inject =
      ['decipher.debaser.options', 'decipher.debaser.constants', 'decipher.debaser.utils',
        'decipher.debaser.stubProvider', '$injector'];

    angular.injector(['decipher.debaser', stubber]);

    return new_stub;
  };

  window.debase = debase;

})(window, window.angular);
