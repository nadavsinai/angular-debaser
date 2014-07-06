(function (angular) {
  'use strict';

  var inject = angular.mock.inject,
      module = angular.mock.module;

  describe('superpowers', function () {

    var powers,
        config;

    beforeEach(module(function ($provide) {
      $provide.constant('decipher.debaser.options', {});
    }, 'decipher.debaser'));

    beforeEach(inject(['decipher.debaser.superpowers', function ($superpowers) {
      powers = $superpowers;
      config = {};
    }]));

    describe('sinon proxy functions', function () {
      it('should return the proper objects', function () {
        var stub = sinon.stub,
          args = {
            callsArg: [0],
            callsArgOn: [0, {}],
            callsArgWith: [0],
            callsArgOnWith: [0, {}],
            yieldsOn: [{}],
            yieldsToOn: ['foo', {}],
            callsArgAsync: [0],
            callsArgOnAsync: [0, {}],
            callsArgWithAsync: [0],
            callsArgOnWithAsync: [0, {}],
            yieldsOnAsync: [{}],
            yieldsToOnAsync: ['foo', {}],
            returnsArg: [0]
          };

        angular.forEach(stub, function (fn, name) {
          var result;
          config.stub = stub();
          if (angular.isFunction(fn) && powers.$SINON_EXCLUDE.indexOf(name) === -1) {
            expect(powers[name]).to.be.a('function');
            if (['onCall', 'onFirstCall', 'onSecondCall',
              'onThirdCall'].indexOf(name) > -1) {
              result = powers[name].apply(config, args[name]);
              expect(result).to.be.an('object');
              expect(result.end).to.be.a('function');
              expect(result.end()).to.equal(config);
            }
            else {
              expect(powers[name].apply(config, args[name])).to.be.undefined;
            }
          }
        });
      });
    });

  });

})(window.angular);
