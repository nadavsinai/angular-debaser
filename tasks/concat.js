'use strict';

module.exports = function () {
  return {
    options: {
      stripBanners: false
    },
    dist: {
      options: {
        banner: '<%= banner %>',
        footer: '<%= footer %>',
        process: function (src) {
          return src
            .replace(/(^|\n)[ \t]*'use strict';\s*/g, '$1')
            .split('\n')
            .map(function (line) {
              return line ? '  ' + line : line;
            })
            .join('\n');
        }
      },
      src: '<%= src_files %>',
      dest: '<%= pkg.main %>'
    },
    docs: {
      options: {
        banner: '<%= banner_docs %>'
      },
      src: '<%= src_files %>',
      dest: './build/docs/<%= pkg.main %>'
    }
  };
};
