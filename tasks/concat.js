'use strict';

module.exports = function () {
  return {
    dist: {
      options: {
        banner: '<%= banner %>',
        footer: '<%= footer %>',
        stripBanners: true,
        process: function (src) {
          return src
            .replace(/(^|\n)[ \t]*'use strict';?\s*/g, '$1')
            .split('\n')
            .map(function(line) {
              return line ? '  ' + line : line;
            })
            .join('\n');
        }
      },
      src: '<%= src_files %>',
      dest: '<%= main %>'
    }
  };
};
