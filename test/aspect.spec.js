(function () {

  'use strict';

  describe('Aspect', function () {

    var Aspect;


    describe('constructor', function () {

      beforeEach(inject(['debaserAspect', function (_Aspect_) {
        Aspect = _Aspect_;
      }]));

      it('should set a name', function () {
        var aspect, named_aspect;
        aspect = new Aspect();
        sandbox.stub(aspect, '_initBehavior');
        sandbox.stub(aspect, '_initProto');
        expect(aspect.name).to.equal('base');
        expect(aspect.parent).to.be.undefined;
        // accessing the getter will make these two defined, so don't.
        expect(aspect._behavior).to.be.undefined;
        expect(aspect._proto).to.be.undefined;
        named_aspect = new Aspect('bob');
        expect(named_aspect.name).to.equal('bob');
      });

      it('should accept a parent aspect', function () {
        var parent, child;
        parent = new Aspect('parent');
        parent.config.foo = 'bar';
        child = new Aspect('child', parent);
        expect(child.parent).to.equal(parent);
        sandbox.stub(parent, 'isAspectOf').returns(true);
        expect(child.config.foo).to.eql(parent.config.foo);
      });

    });

    describe('property', function () {
      var aspect;

      beforeEach(inject(['debaserAspect', function (_Aspect_) {
        Aspect = _Aspect_;
        aspect = new Aspect('properties');
      }]));

      describe('behavior', function () {
        it('should be omnipresent', function () {
          expect(aspect._behavior).to.be.undefined;
          sandbox.spy(aspect, '_initBehavior');
          delete aspect.behavior;
          expect(aspect._behavior).to.be.undefined;
          expect(aspect.behavior).not.to.be.undefined;
          expect(aspect._initBehavior).to.have.been.calledOnce;
          aspect.behavior = null;
          expect(aspect._behavior).to.be.null;
          expect(aspect.behavior).not.to.be.null;
          expect(aspect._initBehavior).to.have.been.calledTwice;
        });
      });

      describe('proto', function () {
        it('should be omnipresent', function () {
          expect(aspect._proto).to.be.undefined;
          sandbox.spy(aspect, '_initProto');
          delete aspect.proto;
          expect(aspect._proto).to.be.undefined;
          expect(aspect.proto).not.to.be.undefined;
          expect(aspect._initProto).to.have.been.calledOnce;
          aspect.proto = null;
          expect(aspect._proto).to.be.null;
          expect(aspect.proto).not.to.be.null;
          expect(aspect._initProto).to.have.been.calledTwice;
        });
      });

      describe('parent', function () {
        it('should set dirty flag', function () {
          var parent = new Aspect('parent');
          aspect.parent = null;
          expect(aspect._dirty).to.be.falsy;
          aspect.parent = parent;
          expect(aspect._dirty).to.be.true;
        });
      });
    });

    describe('method', function () {
      var aspect;

      describe('flush()', function () {

        beforeEach(inject(['debaserAspect', function (_Aspect_) {
          Aspect = _Aspect_;
          aspect = new Aspect('flush');
        }]));

        it('should call serialize() against all queued items in the behavior',
          function () {
            aspect.behavior.queue = [
              {
                assemble: sinon.stub().returns('flushed')
              }
            ];
            expect(aspect.flush()).to.eql(['flushed']);
            expect(aspect.behavior.queue[0].assemble).to.have.been.calledOnce;
          });

      });

      describe('initProto()', function () {
        var aspect,
            Aspect;

        beforeEach(module(function ($provide) {
          $provide.decorator('debaserSuperpowers', function () {
            var fly = sinon.stub(),
                swoop = sinon.stub(),
                invisible = sinon.stub(),
                $special = sinon.stub();
            fly.$aspect = ['base'];
            swoop.$aspect = ['fly'];
            invisible.$aspect = ['base'];

            return {
              fly: fly,
              swoop: swoop,
              invisible: invisible,
              $special: $special
            };
          });
        }));

        beforeEach(inject(['debaserAspect', function (_Aspect_) {
          Aspect = _Aspect_;
          aspect = new Aspect();
          sandbox.spy(aspect, '_initProto');
        }]));

        it('should do nothing if proto exists', function () {
          aspect.proto = 'proto';
          expect(aspect._initProto).not.to.have.been.called;
          aspect._initProto();
          expect(aspect.proto).to.equal('proto');
        });

        it('should avoid any superpowers beginning with $', function () {
          sandbox.stub(aspect, 'createProxy').yields();
          Object.keys(aspect.proto).forEach(function (name) {
            expect(name.charAt(0)).not.to.equal('$');
          });
        });

        it('should inherit aspect from parent', function () {
          var child = new Aspect('fly', aspect);
          expect(aspect.proto.fly).to.be.a('function');
          expect(aspect.proto.invisible).to.be.a('function');
          expect(aspect.proto.swoop).to.be.undefined;
          expect(Object.keys(child.proto)).not.to.eql(Object.keys(aspect.proto));
          expect(child.proto.fly).to.be.a('function');
          expect(child.proto.invisible).to.be.a('function');
          expect(child.proto.swoop).to.be.a('function');
        });

      });

    });

  });

})();
