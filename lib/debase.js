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
