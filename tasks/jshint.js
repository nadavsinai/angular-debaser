'use strict';

module.exports = function () {

  return {
    options: {
      jshintrc: true,
      reporter: require('jshint-stylish')
    },
    gruntfile: {
      src: './Gruntfile.js'
    },
    main: {
      src: ['<%= src_files %>', '<%= test_files %>']
    }
  };

};

