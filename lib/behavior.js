(function (angular) {
  'use strict';

  angular.module('decipher.debaser').factory('$behavior',
    ['$callConfig', function $behaviorFactory(CallConfig) {
      var Behavior = function Behavior(o) {
        angular.extend(this, o);
      };

      Behavior.prototype.enqueue = function enqueue(calls) {
        this.queue.push.apply(this.queue, calls);
      };

      Behavior.prototype.reset = function reset() {
        delete this.queue;
        delete this.config;
      };

      Behavior.prototype.flush = function flush() {
        return this.queue.map(function (call) {
          return call.deserialize();
        });
      };

      Object.defineProperties(Behavior.prototype, {
        queue: {
          get: function getQueue() {
            if (!this._queue) {
              this._queue = [];
            }
            return this._queue;
          },
          set: function setQueue(queue) {
            this._queue = queue || [];
          }
        },
        config: {
          get: function getConfig() {
            if (!this._config) {
              this._config = new CallConfig();
            }
            return this._config;
          },
          set: function setConfig(config) {
            this._config = config || new CallConfig();
          }
        }
      });

      return Behavior;
    }]);

})(window.angular);
