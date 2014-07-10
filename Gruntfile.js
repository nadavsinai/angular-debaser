'use strict';

module.exports = function (grunt) {

  var path = require('path'),
      pkg = grunt.file.readJSON(path.join(__dirname, 'package.json'));

  require('time-grunt')(grunt);

  require('load-grunt-config')(grunt, {
    configPath: path.join(__dirname, 'tasks'),
    data: {
      pkg: pkg,
      banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
        '* Copyright (c) <%= grunt.template.today("yyyy") %> Decipher, Inc.;' +
        ' Licensed <%= pkg.license %> */\n\n' +
        '(function(window, angular) {\n' +
        '  \'use strict\';\n\n',
      footer: '})(window, window.angular);',
      src_files: [
        './lib/globals.js',
        './lib/module.js',
        './lib/*.js'
      ],
      test_files: [
        './test/*.js',
        './test/e2e/*.js'
      ],
      test_deps: [
        './support/angular/angular.js',
        './support/angular-mocks/angular-mocks.js'
      ],
      test_deps_unstable: [
        './support/angular-unstable/angular.js',
        './support/angular-mocks-unstable/angular-mocks.js'
      ],
      main: pkg.main,
      min: pkg.main.replace(/\.js$/, '.min.js'),
      map: pkg.main + '.map'
    }
  });

};

