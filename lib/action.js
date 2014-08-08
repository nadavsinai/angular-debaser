'use strict';

angular.module('decipher.debaser')
  .factory('debaserLoadAction', function loadActionFactory() {

  /**
   * @description Creates a new Action object.
   * @param {object} action Raw action object
   * @param {function} [action.callback=angular.noop] Function to call with the return value of the main Function to call
   * @param {object} [action.object] Object containing main Function to call
   * @param {function} action.func Main Function to call
   * @param {object} [action.context=null] Context to call main Function with
   * @param {Array} [action.args=[]] Arguments to function
   * @constructor
   * @ignore
   * @memberof loadAction
   */
  var Action = function Action(action) {
    angular.extend(this, action);
    this.callback = this.callback || angular.noop;
    this.context = this.context || null;
  };

  Action.prototype.assemble = function assemble() {
    /**
     * @description Executes an assembled function
     * @memberof! Action#assemble
     * @inner
     */
    return angular.bind(this, function action() {
      this.callback(!this.object ? this.func.apply(this.context, this.args) :
        this.object[this.func].apply(this.context, this.args));
    });
  };

  /**
   * @description Accepts a {@link Config} object, constructs and returns {@link Action} instances from its `actions` property
   * @constructs Action
   * @private
   */
  return function loadAction(cfg) {
    return cfg.actions.map(function (action) {
      return new Action(action);
    });
  };
});
