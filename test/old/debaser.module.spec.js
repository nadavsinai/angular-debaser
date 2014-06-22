(function () {
  'use strict';

  var inject = angular.mock.inject;

  describe('decipher.debaser module', function () {
    it('should exist', function () {
      expect(function () {
        angular.module('decipher.debaser');
      }).not.to.throw();
    });

    it('should provide $debaser', inject(function ($injector) {
      expect($injector.has('$debaser')).to.be.true;
    }));
  });

  describe('Debaser', function () {

    var $debaser,
        sandbox;

    beforeEach(function() {
      sandbox = sinon.sandbox.create('Debaser');
      sandbox.spy(window, 'afterEach');
    });

    beforeEach(inject(function (_$debaser_) {
      $debaser = _$debaser_;
    }));

    afterEach(function () {
      sandbox.restore();
    });

    describe('constructor', function () {

      it('should be an object', function () {
        expect($debaser).to.be.an('object');
      });

      it('should have an id', function () {
        expect($debaser.$id).to.be.a('number');
      });

      it('should have a queue', function () {
        expect($debaser.$queue).to.be.an('array');
      });

      it('should register $destroyer with afterEach', function () {
        expect(window.afterEach).to.have.been.called;
        expect(window.afterEach).to.have.been.calledWith($debaser.$destroyer);
      });
    });

    describe('module()', function () {

      it('should enqueue', function () {
        sandbox.spy($debaser, '$enqueue');
        expect($debaser.module('foo')).to.equal($debaser);
        expect($debaser.$queue.length).to.equal(1);
        expect($debaser.$queue[0]).to.be.a('function');
        expect($debaser.$enqueue).to.have.been.calledOnce;
      });

      it('should bootstrap a module', function () {
        angular.module('foo', []).value('bar', 'baz');
        expect($debaser.module('foo').debase()).to.be.undefined;

        expect(function () {
          inject(function (bar) {
            expect(bar).to.equal('baz');
          });
        }).not.to.throw();
      });
    });

  });

})();

