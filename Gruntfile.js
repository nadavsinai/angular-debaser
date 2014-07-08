'use strict';

module.exports = function (grunt) {

  var path = require('path');

  require('time-grunt')(grunt);

  require('load-grunt-config')(grunt, {
    configPath: path.join(__dirname, 'tasks'),
    data: {
      pkg: grunt.file.readJSON(path.join(__dirname, 'package.json')),
      banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
        '* Copyright (c) <%= grunt.template.today("yyyy") %> Decipher, Inc.;' +
        ' Licensed <%= pkg.license %> */\n'
    }
  });

};

