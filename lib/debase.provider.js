;
(function () {
  'use strict';

  angular.module('decipher.debaser').provider('$debase',
    function $debaseProvider() {

      this.$get = [
        '$injector', 'decipher.debaser.options',
        function $debaseFactory($injector, opts) {
          var defaultAdapter = this.adapter,
              globalIgnores = opts.ignores || [],
              globalGenerics = angular.isDefined(opts.generics) ?
                               opts.generics :
                               true,
              globalStubs = opts.stubs || {},

              getAdapter = function getAdapter(name) {
                try {
                  return $injector.get(name);
                }
                catch (e) {
                  throw new Error('debaser: unknown adapter "' + name + '"');
                }
              };

          return function $debase(moduleName, opts) {
            var targets,
                ignores,
                adapter,
                stubs,
                generics,
                cache = {},
                findStub = function findStub(name) {
                  var stub,
                    type;
                  // no stub if this injectable is ignored
                  if (ignores.indexOf(name) >= 0) {
                    return;
                  }
                  // if cached, then use it
                  if (cache[name]) {
                    return cache[name];
                  }
                  stub = stubs[name];
                  if (stub) {
                    //
                    if (angular.isObject(stub)) {
                      type = stub.type || 'object';

                      if (!adapter[stub.type]) {
                        throw new Error('unknown stub type "%s"; valid types are Object, Function, Array, RegExp or Date');
                      }
                      return (cache[name] = adapter[stub.type || 'Object'](stub.value));
                    }
                    else if (angular.isString(stub) && adapter[stub]) {
                      return (cache[name] = adapter[stub]());
                    }
                    else if (angular.isFunction(stub) && adapter[stub.name]) {
                      return (cache[name] = adapter[stub]);
                    }
                    else {
                      throw new Error('stub must be either a stub object or a String');
                    }
                  }
                  if (generics) {
                    return (cache[name] = adapter.Object());
                  }
                };
            if (!moduleName) {
              throw new Error('$debase requires a module name parameter');
            }
            opts = opts || {};
            stubs = opts.stubs || globalStubs;
            targets = opts.targets || [];
            ignores = opts.ignores || globalIgnores;
            generics =
              angular.isDefined(opts.generics) ? opts.generics : globalGenerics;
            adapter = getAdapter(opts.adapter || defaultAdapter);
            angular.mock.module(moduleName, [
              '$provide', function ($provide) {
                angular.module(moduleName)._invokeQueue
                  .filter(function (queueItem) {
                    return [
                      'factory', 'service', 'provider'
                    ].indexOf(queueItem[1]) >= 0;
                  })
                  .forEach(function (queueItem) {
                    var definition = queueItem[2],
                        name = definition[0],
                        value;
                    if (targets.indexOf(name) >= 0) {
                      value = angular.isArray(definition[1]) ?
                              definition[definition.length - 1] :
                              definition[1];
                      angular.injector().annotate(value).forEach(function (name) {
                        var stub = findStub(name);
                        if (stub) {
                          $provide.value(name, stub);
                        }
                      });

                    }
                  });
              }
            ]);
          };
        }
      ];
    });
})();
