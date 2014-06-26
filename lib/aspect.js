(function (angular) {
  'use strict';

  angular.module('decipher.debaser').factory('$aspect', ['$superpowers',
    function $aspectFactory(superpowers) {
      var Aspect = function Aspect(name, parent) {
        this.$name = name;
        this.$parent = parent;
        this.createProxy.cache = parent ? parent.createProxy.cache : {};
        this.$behavior = parent ? parent.$behavior : [];
        this.$behavior.$config = this.$behavior.$config || {};
        this.$proto = this.proto();
      };

      Aspect.prototype.behavior = function behavior() {
        return this.$behavior;
      };

      Aspect.prototype.proto = function proto() {
        var o = {};
        if (this.$proto) {
          return this.$proto;
        }
        angular.forEach(superpowers, function (fn, name) {
          if (fn.$aspect === this.$name) {
            o[name] = this.createProxy(fn, name);
          }
        }, this);
        if (this.$parent) {
          angular.extend(o, this.$parent.proto());
        }
        return o;
      };

      Aspect.prototype.flush = function flush() {
        var behavior = this.$behavior,
            queue = behavior.map(function (c) {
              return c.deserialize();
            });
        return queue;
      };

      Aspect.prototype.name = function name() {
        return this.$name;
      };

      Aspect.prototype.createProxy = function createProxy(fn, name) {
        var proxy,
            cache = this.createProxy.cache,
            behavior,
            config;
        if (cache[name]) {
          return cache[name];
        }
        behavior = this.$behavior;
        config = behavior.$config;
        proxy = function proxy() {
          var call = fn.apply(config, arguments);
          if (call) {
            behavior.push.apply(behavior, call);
          }
          this.$aspect(name);
          return this;
        };
        cache[name] = proxy;
        return proxy;
      };

      Aspect.create = function create(name, parent) {
        var aspect, cache = Aspect.create.cache;
        if (cache[name]) {
          return cache[name];
        }
        aspect = new Aspect(name, parent);
        cache[name] = aspect;
        return aspect;
      };

      return function () {
        Aspect.create.cache = {};

        return Aspect;

      };
    }]);

})(window.angular);
