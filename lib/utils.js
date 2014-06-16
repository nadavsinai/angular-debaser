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
