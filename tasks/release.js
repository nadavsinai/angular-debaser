'use strict';

module.exports = function(grunt) {

  grunt.registerTask('release', 'Build & Bump', function releaseTask(target) {
    grunt.task.run('bump-only:' + target);
    grunt.task.run('docs');
    grunt.task.run('gh-pages');
    grunt.task.run('bump-commit');
  });
};
