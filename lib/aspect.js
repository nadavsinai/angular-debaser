(function (angular) {
  'use strict';

  angular.module('decipher.debaser').factory('$aspect', ['$behavior',
    function $aspectFactory(behavior) {

      var Aspect = function Aspect(name, debaser) {
        this.$name = name;
        this.$debaser = debaser;
        this.$invokeQueue = [];
        this.$proto = this.proto();
      };

      Aspect.createProxy = function createProxy(fn, name) {
        var proxy, cache = Aspect.createProxy.cache;
        if (cache[name]) {
          return cache[name];
        }
        proxy = (function (name) {
          return function proxy() {
            var debaser = this,
                actions = fn.apply(debaser, arguments);
            debaser.$aspect(name, actions);
            return debaser;
          };
        })(name);
        cache[name] = proxy;
        return proxy;
      };
      Aspect.createProxy.cache = {};

      Aspect.prototype.queue = function queue(items) {
        if (angular.isArray(items)) {
          this.$invokeQueue.push.apply(this.$invokeQueue, items);
        } else if (arguments.length) {
          this.$invokeQueue.push.apply(this.$invokeQueue, arguments);
        } else {
          return this.$invokeQueue;
        }
      };

      Aspect.prototype.merge = function merge(aspect) {
        this.$invokeQueue.concat(aspect.queue());
        aspect.clear();
      };

      Aspect.prototype.proto = function proto() {
        var o = {};
        if (this.$proto) {
          return this.$proto;
        }
        angular.forEach(behavior, function (fn, name) {
          if (fn.aspect === 'base' || fn.aspect === this.name) {
            o[name] = Aspect.createProxy(fn, name);
          }
        }, this);
        return o;
      };

      Aspect.prototype.clear = function clear() {
        this.$invokeQueue = [];
      };

      Aspect.prototype.flush = function flush() {
        var queue;
        if (this.$invokeQueue.length) {
          queue = Aspect.deserialize(this.$invokeQueue);
          this.$debaser.$enqueue.apply(this.$debaser, queue);
          this.clear();
        }
      };

      Aspect.deserialize = function deserialize(queue) {
        return queue.map(function (c) {
          return c.deserialize();
        });
      };

      Aspect.prototype.name = function name() {
        return this.$name;
      };

      Aspect.create = function create(name, debaser) {
        var aspect, cache = Aspect.create.cache;
        if (cache[name] && cache[name][debaser.$name]) {
          return cache[name][debaser.$name];
        } else if (!cache[name]) {
          cache[name] = {};
        }
        aspect = new Aspect(name, debaser);
        cache[name][debaser.$name] = aspect;
        return aspect;
      };
      Aspect.create.cache = {};

      return Aspect;

    }]);

})(window.angular);
