# angular-debaser [![Build Status](https://travis-ci.org/decipherinc/angular-debaser.svg?branch=master)](https://travis-ci.org/decipherinc/angular-debaser) [![Coverage Status](https://img.shields.io/coveralls/decipherinc/angular-debaser.svg)](https://coveralls.io/r/decipherinc/angular-debaser?branch=master)

Just a better way to test AngularJS code.

## API

*If Sinon.JS is present, see [this API](http://sinonjs.org/docs/#stubs) for working with functions.*

See [the API documentation](http://decipherinc.github.io/angular-debaser/).

## Installation

```
bower install angular-debaser
```

Optionally, save it to your `bower.json`: you probably don't want to use `--save`; use `--save-dev`.

### Dependencies & Recommended Packages

Current dependencies:

  - [AngularJS](http://angularjs.org)
  - [angular-mocks](https://github.com/angular/bower-angular-mocks) 
  
Required, but not marked as dependencies:
 
  - [Mocha](http://visionmedia.github.io/mocha/) w/ [Chai](http://chaijs.com) *or*
  - [Jasmine](http://jasmine.github.io/)

Recommended:

  - [sinon-ng](http://github.com/boneskull/sinon-ng) for working with `$q`; `bower install sinon-ng`

Depending on your test runner setup, you may want to install these either via `bower` or `npm`:

  - [Sinon.JS](http://sinonjs.org) for stubbing/spying
  - [Sinon-Chai](https://github.com/domenic/sinon-chai) or [jasmine-sinon](https://github.com/froots/jasmine-sinon) for BDD-style Sinon.JS integration.
  - [Chai-as-Promised](https://github.com/domenic/chai-as-promised/) for Chai assertions against Promises

  > If you're using [Karma](http://karma-runner.github.io/) as a test runner w/ Chai, you may want to grab [karma-chai-plugins](https://www.npmjs.org/package/karma-chai-plugins) to get Sinon-Chai and Chai-as-Promised.

Also, if you are [testing directives](https://github.com/vojtajina/ng-directive-testing), I've found that [jQuery](http://jquery.com) is always handy to have around.

## Issues

[Issues here](https://github.com/decipherinc/angular-debaser/issues/).

## License

Copyright &copy; 2014 [Decipher, Inc.](http://decipherinc.com)  Licensed MIT.

## Maintainer

[Christopher Hiller](http://github.com/boneskull)

