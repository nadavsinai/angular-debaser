(function (angular) {
  'use strict';

  angular.module('decipher.debaser')
    .factory('decipher.debaser.action', function $callFactory() {

      var Action = function Action(action) {
        this.action = action;
      };

      Action.prototype.deserialize = function deserialize() {
        return function action() {
          this.callback(this.object[this.func].apply(this.context,
            this.args));
        }.bind(this.action);
      };

      return function load(cfg) {
        return cfg.actions.map(function (action) {
          return new Action(action);
        });
      };
    });

})(window.angular);
