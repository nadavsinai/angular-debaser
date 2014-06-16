(function (angular) {
  'use strict';

  angular.module('decipher.debaser')
    .provider('decipher.debaser.adapters.vanilla', function () {
      var isFloat = function isFloat(n) {
            var num = Number(n);
            return num | 0 === n;
          };

      //TODO: forget about this garbage and match sinon stub api
      return {
        'object': function (opts) {
          return new Object(opts);
        },
        'function': function (opts) {
          var prototype = opts.prototype,
              returns = opts.returns,
              returnsArg = opts.returnsArg,
              callsArg = opts.callsArg,
              callsArgWith = opts.callsArgParams,
              callsArgContext = opts.callsArgContext || null,
              context = opts.context || null,
              body = '';

          if (callsArg) {
            if (isFloat(callsArg) || isNaN(callsArg)) {
              throw new Error('callsArg must be an integer');
            }
            if (callsArgWith && !angular.isArray(callsArgWith)) {
              throw new Error('callsArgWith must be an array of parameters');
            }
            body += 'arguments[target].apply(callCtx, params);';
          }

          if (returnsArg) {
            if (isFloat(returnsArg) || isNaN(returnsArg)) {
              throw new Error('returnsArg must be an integer');
            }
            body += 'return arguments[identity];';
          }
          else if (returns) {
            body += 'return retval;';
          }

          return function (body, ctx, target, callCtx, params, identity, retval,
            prototype) {
            var fn = new Function(body).bind(ctx);
            if (prototype) {
              fn.prototype = Object.create(prototype);
            }
            return fn;
          }(body, context, callsArg, callsArgContext, callsArgWith || [],
            returnsArg, returns, prototype);
        },
        'array': function () {
          if (arguments.length === 0) {
            return [];
          }
          return Array.prototype.slice.apply(arguments);
        },
        'regexp': function () {
          return new RegExp();
        },
        'date': function () {
          return new Date();
        },
        $get: function () {
          throw new Error('not implemented');
        }

      };

    });

})(window.angular);
