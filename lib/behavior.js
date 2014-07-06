(function (angular) {
  'use strict';

  angular.module('decipher.debaser').factory('decipher.debaser.behavior',
    ['decipher.debaser.config', function $behaviorFactory(Config) {
      var Behavior = function Behavior(o, aspect_name) {
        angular.extend(this, o);
        this._aspect_name = aspect_name;
        this._id = Behavior._id++;
      };

      Behavior._id = 0;

      Behavior.prototype.enqueue = function enqueue(calls) {
        this.queue.push.apply(this.queue, calls);
      };

      Behavior.prototype.flush = function flush() {
        return this.queue.map(function (action) {
          return action.deserialize();
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
              this._config = new Config(this._aspect_name);
            }
            return this._config;
          },
          set: function setConfig(config) {
            this._config = config || new Config(this._aspect_name);
          }
        }
      });

      return Behavior;
    }]);

})(window.angular);
