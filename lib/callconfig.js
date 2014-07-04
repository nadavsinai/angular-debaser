(function (angular) {

  'use strict';

  angular.module('decipher.debaser').factory('$callConfig',
    function $callConfigFactory() {

      /**
       * @name CallConfig
       * @param o
       * @constructor
       */
      var CallConfig = function CallConfig(o) {
        angular.extend(this, o);
        this._callbacks = [];
        this._cb_idx = 0;
        this._id = CallConfig._id++;
        this.calls = this.calls || [];
      };

      CallConfig._id = 0;

      CallConfig.prototype.addCall = function addCall(opts) {
        if(!opts) {
          throw new Error('$debaser: addCall() expects call options');
        }
        opts.callback = opts.callback || this.runner();
        opts.context = angular.isDefined(opts.context) ? opts.context : opts.object || null;
        this.calls.push(opts);
      };

      CallConfig.prototype.next = function next() {
        if (this._callbacks[this._cb_idx]) {
          this._callbacks[this._cb_idx++].apply(this, arguments);
        } else {
          this.done();
        }
      };

      CallConfig.prototype.done = function done() {
        this._cb_idx = 0;
      };

      CallConfig.prototype.chain = function chain(fn) {
        this._callbacks.push(function debaserCallbackProxy() {
          this.next(fn.apply(this, arguments));
        }.bind(this));
      };

      CallConfig.prototype.runner = function runner() {
        return function run() {
          this.next.apply(this, arguments);
        }.bind(this);
      };

      CallConfig.prototype.isChained = function isChained() {
        return !!this._callbacks.length;
      };

      Object.defineProperties(CallConfig.prototype, {
        provider: {
          get: function getProvider() {
            return this._provider;
          },
          set: function setProvider(fn) {
            var cfg = this;
            this._provider = function($provide) {
              fn.call(cfg, $provide);
            };
            this._provider.$inject = ['$provide'];
          }
        }
      });

      return CallConfig;

    });

})(window.angular);
