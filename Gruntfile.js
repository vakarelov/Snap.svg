module.exports = function(grunt) {

          var pkg = grunt.file.readJSON('package.json'),
              core = [
                './src/mina.js',
                './src/svg.js',
                './src/element.js',
                './src/animation.js',
                './src/matrix.js',
                './src/attr.js',
                './src/class.js',
                './src/attradd.js',
                './src/paper.js',
                './src/path.js',
                './src/set.js',
                './src/equal.js',
                './src/mouse.js',
                './src/filter.js',
                './src/align.js',
                './src/colors.js',
                './src/bezier.js',
                './src/hull.js',
                './src/polygons.js',
                './src/convex_overlap.js',
                './src/point_utils.js',
                './src/snap_extensions.js',
                './src/element_extensions.js',
                './src/paper_extensions.js',
              ],
              src = [
                './src/eve.js',
                './src/amd-banner.js',
                './src/amd-footer.js',
              ];

          src.splice(2, 0, core);

          grunt.initConfig({
            pkg: pkg,
            banner: grunt.file.read('./src/copy.js').
                replace(/@VERSION/, pkg.version).
                replace(/@DATE/, grunt.template.today('yyyy-mm-dd')) + '\n',
            terser: {
              options: {
                output: {
                  preamble: '<%= banner %>',
                  comments: false
                }
              },
              dist: {
                src: '<%= concat.target.dest %>',
                dest: './dist/snap.svg-min.js',
              },
            },
            concat: {
              options: {
                banner: '<%= banner %>',
              },
              target: {
                dest: './dist/snap.svg.js',
                src: src,
              },
            },
            exec: {
              dr: {
                command: 'node node_modules/dr.js/dr dr.json',
              },
              test: {
                command: 'cd test; phantomjs test.js',
              },
              eslint: {
                command: './node_modules/eslint/bin/eslint.js ' + core.join(' '),
              },
            },
            prettify: {
              options: {
                indent: 4,
                indent_char: ' ',
                wrap_line_length: 80,
                brace_style: 'expand',
                unformatted: ['code', 'pre', 'script'],
              },
              one: {
                src: './doc/reference.html',
                dest: './doc/reference.html',
              },
            },
          });

          grunt.loadNpmTasks('grunt-contrib-concat');
          grunt.loadNpmTasks('grunt-terser');
          grunt.loadNpmTasks('grunt-exec');
          grunt.loadNpmTasks('grunt-prettify');

          grunt.registerTask('default',
              [
                // 'exec:eslint',
                'concat', 'terser', 'exec:dr', 'prettify']);
          grunt.registerTask('lint', ['exec:eslint']);
          grunt.registerTask('test', ['exec:test']);
        };