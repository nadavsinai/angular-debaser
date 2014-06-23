(function(angular) {
  'use strict';

  angular.module('decipher.debaser')
    .factory('$call', function $callFactory() {

      var Call = function Call(object, fn_name, args, ctx) {
        this.object = object;
        this.fn_name = fn_name;
        this.args = args;
        this.ctx = ctx || null;
      };

      Call.prototype.deserialize = function deserialize() {
        var object = this.object,
            fn_name = this.fn_name,
            args = this.args,
            ctx = this.ctx;

        return function debaserCall() {
          object[fn_name].apply(ctx, args);
        };
      };

      return Call;

    });

})(window.angular);
