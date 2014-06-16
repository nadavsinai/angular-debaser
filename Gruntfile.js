module.exports = function (grunt) {
  'use strict';

  require('time-grunt')(grunt);

  // Project configuration
  grunt.initConfig({
    // Metadata
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> Decipher, Inc.;' +
      ' Licensed <%= pkg.license %> */\n',
    // Task configuration
    concat: {
      options: {
        banner: '<%= banner %>',
        stripBanners: true
      },
      dist: {
        src: ['lib/debase.js', 'lib/module.js', 'lib/adapters/*.js', 'lib/stub.js', 'lib/utils.js', 'lib/config.js', 'lib/hook.js'],
        dest: 'debaser.js'
      }
    },
    uglify: {
      options: {
        banner: '<%= banner %>',
        sourceMap: true
      },
      dist: {
        src: '<%= concat.dist.dest %>',
        dest: 'debaser.min.js'
      }
    },
    jshint: {
      options: {
        jshintrc: true
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      lib_test: {
        src: ['lib/**/*.js', 'test/**/*.js']
      }
    },
    karma: {
      options: {
        frameworks: ['mocha', 'chai-sinon'],
        files: [
          './support/angular/angular.js',
          './support/angular-mocks/angular-mocks.js',
          './support/sinonjs/sinon.js',
          './debaser.js',
          './test/**/*.js'
        ],
        browsers: ['PhantomJS'],
        reporters: ['story']
      },
      continuous: {
        options: {
          singleRun: true
        }
      },
      dev: {
        options: {
          browsers: ['Chrome'],
          background: true
        }
      }
    },
    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      lib_test: {
        files: '<%= jshint.lib_test.src %>',
        tasks: ['jshint:gruntfile', 'build', 'karma:dev:run']
      }
    },
    'bower-install-simple': {
      options: {
        directory: 'support'
      }
    }
  });

  require('load-grunt-tasks')(grunt);

  // Default task
  grunt.registerTask('build', ['concat', 'uglify']);
  grunt.registerTask('test', ['bower-install-simple', 'jshint', 'karma:continuous']);
  grunt.registerTask('default', ['bower-install-simple', 'karma:dev:start', 'watch']);
};

