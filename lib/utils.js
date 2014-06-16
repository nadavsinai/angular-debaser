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

  getAdapter = function getAdapter(name, $injector) {
    var injector;
    if (getAdapter.cache[name]) {
      return getAdapter.cache[name];
    }
    if (!angular.isString(name)) {
      return (getAdapter.cache[name] = name);
    }
    try {
      injector = $injector || angular.injector(['decipher.debaser']);
      return (getAdapter.cache[name] = injector.get(name + 'Provider')());
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
