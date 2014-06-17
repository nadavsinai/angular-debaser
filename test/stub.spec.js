(function (debase, angular, sinon) {
  'use strict';

  var sandbox,
      module = angular.mock.module,
      inject = angular.mock.inject;

  beforeEach(function () {
    sandbox = sinon.sandbox.create('decipher.debaser.stub');
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('decipher.debaser.stub', function () {

    var Stub;

    beforeEach(function () {
      module(function ($stubProvider) {
        Stub = angular.isObject($stubProvider) ? $stubProvider.Stub : $stubProvider;
      });
      inject();
    });

    describe('factory', function () {
      //TODO do this for sinon adapter
      it('should throw if attempted to use as factory', inject(function ($injector) {
        expect(function () {
          $injector.get('$stub');
        }).to.throw('not implemented');
      }));
    });

    describe('findStub()', function () {

      it('should throw if no name specified', function () {
        expect(Stub.findStub).to.throw('name is required');
      });

      it('should throw if stubs are empty', function () {
        expect(function () {
          Stub.findStub('foo', {
            stubs: {}
          }).to.throw('define stubs!');
        });
      });

      it('should should throw if there is no adapter', function () {
        expect(function () {
          Stub.findStub('foo', {
            stubs: {
              'foo': angular.noop
            }
          }).to.throw('where the hell is the adapter?');
        });
      });

      // TODO test caching

      it('should ignore ignores', function () {
        expect(Stub.findStub('foo', {
          stubs: {
            'foo': angular.noop
          },
          adapter: {},
          ignores: {
            'foo': true
          }
        })).to.be.null;
      });

      it('should throw if unknown String-type stub', inject(function ($constants) {

        expect(function () {
          Stub.findStub('foo', {
            stubs: {
              'foo': 'bar'
            },
            adapter: {}
          });
        }).to.throw('Unknown stub type "bar".  Valid types are: ' +
            $constants.STUB_TYPES.join(', '));
      }));

      it('should instantiate a Stub object if given supported String value', function () {
        var baz = function () {
              return 'baz';
            },
            stub = Stub.findStub('foo', {
              stubs: {
                'foo': 'bar'
              },
              adapter: {
                'bar': baz
              }
            });
        expect(stub).to.deep.equal(new Stub({
          $name: 'foo',
          $type: 'bar',
          $proxy: 'baz'
        }));
      });

      it('should give a proxy to a preexisting Stub, if it has a $type', function () {
        var stub = new Stub({
            }),
            adapter = {
              bar: function () {
                return 'baz';
              }
            };

        sandbox.spy(adapter, 'bar');
        expect(Stub.findStub('foo', {
          stubs: {
            foo: stub
          },
          adapter: {}
        })).to.equal(stub);
        expect(stub.$type).to.be.undefined;

        Stub.findStub.cache = {};
        stub.$type = 'bar';
        stub.$opts = {};
        expect(Stub.findStub('foo', {
          stubs: {
            foo: stub
          },
          adapter: adapter
        })).to.equal(stub);
        expect(stub.$proxy).to.equal('baz');
        expect(adapter.bar).to.have.been.calledOnce;
      });

      it('should allow custom functions', function () {
        var stub = angular.noop;
        expect(Stub.findStub('foo', {
          stubs: {
            foo: stub
          },
          adapter: {}
        })).to.deep.equal(new Stub({
            $name: 'foo',
            $proxy: stub
          }));
      });

    });

  });
})(window.debase, window.angular, window.sinon);

