(function (angular) {
  'use strict';

  angular.module('decipher.debaser').factory('$superpowers',
    ['$call', '$window', function $superpowersFactory(call, $window) {

      var sinon = $window.sinon;

      var module = function module(name) {
        if (!name) {
          return;
        }
        if (!angular.isString(name)) {
          throw new Error('$debaser: module() expects a string');
        }
        this.module = name;
        this.module_dependencies = [];
        return call([angular, 'module', [this.module, this.module_dependencies],
          angular], [angular.mock, 'module', [name], angular.mock]);
      };
      module.$aspect = 'base';

      var withDep = function withDep() {
        if (!arguments.length) {
          return;
        }
        Array.prototype.slice.call(arguments).forEach(function (arg) {
          if (!angular.isString(arg)) {
            throw new Error('$debaser: withDep() expects one or more strings');
          }
        });
        this.module_dependencies.push.apply(this.module_dependencies,
          arguments);
      };
      withDep.$aspect = 'module';

      var withDeps = function withDeps(arr) {
        if (!arr) {
          return;
        }
        if (!angular.isArray(arr)) {
          throw new Error('$debaser: withDeps() expects an array');
        }
        superpowers.withDep.apply(this, arr);
      };
      withDeps.$aspect = 'module';

      var func = function func(name) {
        if (!name) {
          return;
        }
        if (!angular.isString(name)) {
          throw new Error('$debaser: func() expects a name');
        }
        this.stub = sinon.stub();
        this.name = name;
        this.component = 'value';
        this.provider = function ($provide) {
          $provide[this.component](this.name, this.stub);
        }.bind(this);
        this.provider.$inject = ['$provide'];
        return call(angular.mock, 'module', [this.provider], angular.mock);
      };
      func.$aspect = 'base';

      var superpowers = {
        module: module,
        withDep: withDep,
        withDeps: withDeps,

        func: func
      };

      //TODO: identify which we can really use.
      angular.forEach(sinon.stub, function (fn, name) {
        var sinonProxy = function sinonProxy() {
          fn.apply(this.stub, arguments);
        };
        sinonProxy.$aspect = 'func';
        superpowers[name] = sinonProxy;
      });

      return superpowers;
    }]);

})(window.angular);
