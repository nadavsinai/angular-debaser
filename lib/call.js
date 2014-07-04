(function (angular) {
  'use strict';

  angular.module('decipher.debaser')
    .factory('$call', function $callFactory() {

      var Call = function Call(cfg, call) {
        this.$cfg = cfg;
        this.$call = call;
        delete this.calls;
      };

      Call.prototype.deserialize = function deserialize() {
        var call = this.$call,
            cfg = this.$cfg;

        var debaserCall = function debaserCall() {
          this.callback(this.object[this.func].apply(this.context, this.args));
        }.bind(call);

        debaserCall.toString = function toString() {
          return cfg._provider && cfg._provider.toString();
        };

        return debaserCall;
      };

      return function call(cfg) {
        return cfg.calls.map(function (c) {
          return new Call(cfg, c);
        });
      };
    });

})(window.angular);
