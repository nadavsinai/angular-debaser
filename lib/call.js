(function(angular) {
  'use strict';

  angular.module('decipher.debaser')
    .factory('$call', function $callFactory() {

      var Call = function Call(cfg, opts) {
        this.$cfg = cfg;
        angular.extend(this, opts);
        this.context = this.context|| this.object || null;
        this.callback = angular.isFunction(this.callback) || cfg.runner();
      };

      Call.prototype.toString = function toString() {
        return JSON.stringify({
          args: this.args,
          callback: this.callback,
          func: this.func,
          $cfg: this.$cfg
        }, null, 2);
      };

      Call.prototype.deserialize = function deserialize() {
        var object = this.object,
            func = this.func,
            context = this.context,
            callback = this.callback,
            args = this.args.map(function (arg) {
              return this.$cfg[arg];
            }, this);

        var debaserCall = function debaserCall() {
          window.console.warn(args);
          callback(object[func].apply(context, args));
        }.bind(this);
        debaserCall.toString = function toString() {
          return JSON.stringify({
            args: args,
            func: func
          }, null, 2);
        };
        return debaserCall;
      };

      return function call(cfg) {
        var calls = Array.prototype.slice.call(arguments, 1);
        return calls.map(function (opts) {
          return new Call(cfg, opts);
        });
      };

    });

})(window.angular);
