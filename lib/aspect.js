(function (angular) {
  'use strict';

  angular.module('decipher.debaser').factory('$aspect',
    ['$superpowers', '$behavior',
      function $aspectFactory(superpowers, Behavior) {

        var Aspect = function Aspect(name, parent) {
          this.name = name;
          this.parent = parent;
        };

        Aspect._DEFAULT_NAME = 'base';

        Object.defineProperties(Aspect.prototype, {
          name: {
            get: function getName() {
              return this._name;
            },
            set: function setName(name) {
              this._dirty = this._isDirty(name, '_name');
              this._name = name || Aspect._DEFAULT_NAME;
            }
          },
          parent: {
            get: function getParent() {
              return this._parent;
            },
            set: function setParent(parent) {
              this._dirty = this._isDirty(parent, '_parent');
              this._parent = parent;
            }
          },
          proto: {
            get: function getProto() {
              var dirty = this._dirty;
              if (!this._proto || dirty) {
                this._initProto(dirty);
              }
              this._dirty = false;
              return this._proto;
            },
            set: function setProto(proto) {
              this._proto = proto;
            }
          },
          behavior: {
            get: function getBehavior() {
              var dirty = this._dirty;
              if (!this._behavior || dirty) {
                this._initBehavior(dirty);
              }
              this._dirty = false;
              return this._behavior;
            },
            set: function setBehavior(behavior) {
              this._behavior = behavior;
            }
          },
          config: {
            get: function getConfig() {
              return this.behavior.config;
            },
            set: function setConfig(config) {
              this.behavior.config = config;
            }
          }
        });

        Aspect.prototype._initProto = function _initProto(force) {
          var o;
          if (this._proto && !force) {
            return;
          }
          o = {};
          if (this.parent) {
            angular.extend(o, this.parent.proto);
          }
          angular.forEach(superpowers, function (fn, name) {
            if (name.charAt(0) !== '$' &&
              fn.$aspect.indexOf(this._name) !== -1) {
              o[name] = this.createProxy(fn, name);
            }
          }, this);
          this._proto = o;
        };

        Aspect.prototype._initBehavior = function _initBehavior(force) {
          if (this._behavior && !force) {
            return;
          }

          this._behavior = new Behavior(angular.extend(this._behavior || {},
              this.parent && this.parent.isAspectOf(this.name) &&
              this.parent.behavior));
        };

        Aspect.prototype.flush = function flush() {
          return this.behavior.flush();
        };

        Aspect.prototype.reset = function reset() {
          this.behavior.reset();
        };

        Aspect.prototype._isDirty = function _isDirty(value, prop) {
          return (value && value !== this[prop]) || (!value && this[prop]);
        };

        Aspect.prototype.createProxy = function createProxy(fn, name) {
          var proxy,
              cache = this.createProxy.cache;

          if (cache[name]) {
            return cache[name];
          }
          /**
           * @this Debaser
           * @returns {Debaser|*}
           * @todo trim fat
           */
          proxy = function proxy() {
            var current_aspect = this.$$aspect,
                inherits = current_aspect.isAspectOf(name),
                retval = this,
                aspect,
                result,
                behavior = current_aspect.behavior;

            if (!inherits && current_aspect.name !== 'base') {
              this.$enqueue();
            }
            aspect = this.$aspect(fn._name || name);
            if (!inherits) {
              behavior = aspect.behavior;
            }
            result = fn.apply(this, arguments);

            if (angular.isArray(result)) {
              behavior.enqueue(result);
            }
            else if (result) {
              retval = result;
            }
            return retval;
          };
          cache[name] = proxy;
          return proxy;
        };
        Aspect.prototype.createProxy.cache = {};

        Aspect.prototype.isAspectOf = function isAspectOf(name) {
          // if we are switching from base to another base, then we do not
          // inherit the parent.
          // otherwise we're switching from a base to a nested aspect,
          // which means we keep the parent.
          // if we're in a function's aspect and the new function is of
          // that aspect, then we inherit from the parent.
          return this.name !== 'base' && name !== 'base' && superpowers[name] &&
            superpowers[name].$aspect.indexOf(this.name) !== -1;
        };

        return Aspect;
      }
    ]);

})(window.angular);