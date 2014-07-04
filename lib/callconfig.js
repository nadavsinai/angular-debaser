(function (angular) {

  'use strict';

  angular.module('decipher.debaser').factory('$callConfig',
    function $callConfigFactory() {

      var CallConfig = function CallConfig(o) {
        angular.extend(this, o);
        this.callbacks = this.callbacks || [];
        this.cb_idx = 0;
      };

      CallConfig.prototype.next = function next() {
        if (this.callbacks[this.cb_idx]) {
          this.callbacks[this.cb_idx++].apply(this, arguments);
        } else {
          this.done();
        }
      };

      CallConfig.prototype.done = function done() {
        this.cb_idx = 0;
      };

      CallConfig.prototype.chain = function chain(fn) {
        this.callbacks.push(function debaserCallbackProxy() {
          this.next(fn.apply(this, arguments));
        }.bind(this));
      };

      CallConfig.prototype.runner = function runner() {
        return function run() {
          this.next.apply(this, arguments);
        }.bind(this);
      };

      CallConfig.prototype.isChained = function isChained() {
        return !!this.callbacks.length;
      };

      return CallConfig;

    });

})(window.angular);
