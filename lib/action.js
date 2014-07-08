(function (angular) {
  'use strict';

  angular.module('decipher.debaser')
    .factory('decipher.debaser.loadAction', function loadActionFactory() {

      var Action = function Action(action) {
        angular.extend(this, action);
      };

      Action.prototype.deserialize = function deserialize() {
        return function action() {
          this.callback(this.object[this.func].apply(this.context,
            this.args));
        }.bind(this);
      };

      return function loadAction(cfg) {
        return cfg.actions.map(function (action) {
          return new Action(action);
        });
      };
    });

})(window.angular);
