'use strict';

angular.module('decipher.debaser').factory('decipher.debaser.config',
  function configFactory() {

    /**
     * @name Config
     * @param o
     * @constructor
     * @param aspect_name
     */
    var Config = function Config(o, aspect_name) {
      if (angular.isString(o)) {
        aspect_name = o;
      }
      else {
        angular.extend(this, o);
      }
      this._aspect_name = aspect_name;
      this._callbacks = [];
      this._cb_idx = 0;
      this._id = Config._id++;
      this.actions = this.actions || [];
    };

    Config._id = 0;

    Config.prototype.addAction = function addAction(opts) {
      if (!opts) {
        throw new Error('$debaser: addCall() expects call options');
      }
      opts.callback = opts.callback || this.runner();
      opts.context =
        angular.isDefined(opts.context) ? opts.context : opts.object || null;
      this.actions.push(opts);
    };

    Config.prototype.next = function next() {
      if (this._callbacks[this._cb_idx]) {
        this._callbacks[this._cb_idx++].apply(this, arguments);
      } else {
        this.done();
      }
    };

    Config.prototype.done = function done() {
      this._cb_idx = 0;
    };

    Config.prototype.chain = function chain(fn) {
      this._callbacks.push(function debaserCallbackProxy() {
        this.next(fn.apply(this, arguments));
      }.bind(this));
    };

    Config.prototype.runner = function runner() {
      return function run() {
        this.next.apply(this, arguments);
      }.bind(this);
    };

    Config.prototype.isChained = function isChained() {
      return !!this._callbacks.length;
    };

    return Config;

  });
