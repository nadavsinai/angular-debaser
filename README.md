# angular-debaser

Stubbing so easy your Andalusian dog could do it.

## Synopsis

Given:

```js
angular.module('myApp', [])
  // note Bar, Baz and Quux are not even defined.
  // this helps when testing submodules, so you do not have to include a 
  // load of other modules elsewhere to get the dependencies you need.
  .constant('Cheese', function() {
    return 'cheddar';
  })
  .controller('Foo', function($scope, Bar, Baz, Quux, Cheese) {
    $scope.quux = Quux;
    $scope.bar = Bar;
    $scope.baz = Baz;    
    $scope.cheese = Cheese;
    $scope.bar();
  });
```

With spec:

```js
describe('Foo controller', function() { 

  // second param is a target or array of targets
  // note the lack of `beforeEach(module('myApp'))` here.
  debase('myApp', 'Foo', {
    stubs: {
      // equivalent to `debaser.stub('function')`, `sinon.stub()`, or just `Function`
      Bar: 'function',
      
      // equivalent to `sinon.stub({spam: function() {}})`;
      // `debaser.stub()` is necessary if you want to stub providers (for now)
      Baz: debaser.stub('object', {
        spam: function() {}
      }),
      
      // or, just use sinon.
      Quux: sinon.stub().returns('a SinonJS stub'),
      
      // if you start chaining things, you may want to use `base()`.  if you didn't
      // here, you would not get a provider.
      // this is equivalent to:
      // `debaser.stub('function', sinon.stub().returns('havarti'), {provider: true});`
      Cheese: debaser.stub('function', null, {
        provider: true
      }).returns('havarti').base()
      
    }    
  });
  
  it('should just work', inject(function($controller) {
    // in autoScope mode, you get a Scope for free.
    var scope;
    expect(function() {
      scope = $controller('Foo').scope();
    }).not.to.throw();    
    expect(scope.bar).to.be.a('function');
    expect(scope.bar).to.have.been.called;
    expect(scope.baz).to.be.an('object');
    expect(scope.baz.spam).to.be.a('function');
    expect(scope.baz.spam).not.to.have.been.called;
    expect(scope.quux()).to.equal('a SinonJS stub');
    expect(scope.cheese()).to.equal('havarti');
  }));
});
```
- Accepts options globally (via `debase.options()`), per suite, or at the stub level (via a helper function) for granular control.

- Automatic scope mode (option `autoScope`) assists testing controllers by doing the `$rootScope.$new()` nonsense for you.

- Automatic mode (option `autoStub`), when combined with a list of ignored injectables, might get your tests passing sooner--stub everything; ask questions later.

## Installation

```
bower install angular-debaser
```

You probably don't want to use `--save`; use `--save-dev`.

Current dependencies:

  - [SinonJS](http://sinonjs.org) 
  - [AngularJS](http://angularjs.org)
  - [angular-mocks](https://github.com/angular/bower-angular-mocks) 
  
Required, but not marked as dependencies:
 
  - [Mocha](http://visionmedia.github.io/mocha/) *or* 
  - [Jasmine](http://jasmine.github.io/)

## Roadmap

- Create basic adapter for use w/o SinonJS; basic stubs with no spying.
- Support SinonJS `.onCall()` method
- Automatically stub modules; not just components.
- Support mocks?  Dunno.

## License

Copyright &copy; 2014 [Decipher, Inc.](http://decipherinc.com).  Licensed MIT.

## Maintainer

[Christopher Hiller](http://github.com/boneskull)

