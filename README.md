# angular-debaser

Stubbing so easy your Andalusian dog could do it.

## Synopsis

I wanted to avoid manually having to `$provide` a bunch of stuff, so...

Given:

```js
angular.module('myApp', [])
  // note Bar, Baz and Quux are not even defined.
  // this helps when testing submodules, so you do not have to include a 
  // load of other modules elsewhere to get the dependencies you need.
  .controller('Foo', function($scope, Bar, Baz, Quux) {
    $scope.quux = Quux;
    $scope.bar = Bar;
    $scope.baz = Baz;    
    
    $scope.bar();
  });
```

With spec:

```js
describe('Foo controller', function() { 

  // second param is a target or array of targets
  // note the lack of "beforeEach(module('myApp'))" here.
  debase('myApp', 'Foo', {
    stubs: {
      Bar: 'function',
      Baz: 'object',
      Quux: function() {
        return 'some custom function';
      }
    }    
  });
  
  it('should just work', inject(function($controller, $rootScope) {
    var scope = $rootScope.$new();
    expect(function() {
      $controller('Foo', {$scope: scope});
    }).not.to.throw();    
    expect(scope.bar).to.be.a('function');
    expect(scope.bar).to.have.been.called;
    expect(scope.baz).to.be.an('object');
    expect(scope.quux()).to.equal('some custom function');
  }));
});
```

Works w/ or w/o SinonJS; depends on angular-mocks.

Accepts options globally, per suite, or at the stub level (via a helper function) for granular control.

Automatic mode, when combined with a list of ignored injectables, might get your tests passing sooner--stub everything; ask questions later.

## Roadmap

- Automatically stub modules; not just components.

