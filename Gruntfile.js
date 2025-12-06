module.exports = function (grunt) {

    const pkg = grunt.file.readJSON('package.json');
    const core = [
        './src/mina.js',
        './src/snap.js',           // Renamed from svg.js - contains core utilities without constructors
        './src/fragment-class.js', // Fragment constructor + registration
        './src/element-class.js',  // Element constructor + prototype methods + registration
        './src/paper-class.js',    // Paper constructor + prototype methods + registration
        './src/hull.js',           //hull is needed by element to compute fast BBoxes
        './src/animation.js',
        './src/matrix.js',
        './src/attr.js',
        './src/class.js',
        './src/attradd.js',
        './src/bbox.js',
        './src/path.js',
        './src/set.js',
        './src/equal.js',
        './src/mouse.js',
        './src/filter.js',
        './src/align.js',
        './src/colors.js',

        // './src/bezier.js',
        // './src/polygons.js',
        // './src/convex_overlap.js',
        // './src/point_utils.js',

        // './src/snap_extensions.js',
        // './src/element_extensions.js',
        // './src/paper_extensions.js',
    ];

    const adv = [
        './src/bezier.js',
        './src/polygons.js',
        './src/convex_overlap.js',
        './src/point_utils.js',
    ]

    const ia_ext = [
        './src/shapes.js',
        './src/nonlin-transforms.js',
        './src/snap_extensions.js',
        './src/element_extensions.js',
        './src/paper_extensions.js',
        './src/warp.js'
    ]

    const wrap = [
        './src/eve.js',
        './src/amd-banner.js',
        './src/amd-footer.js',
    ];

    const src_bsk = [...wrap.slice(0, 2), ...core, ...wrap.slice(2)];
    const src_adv = [...wrap.slice(0, 2), ...core, ...adv, ...wrap.slice(2)];
    const src = [...wrap.slice(0, 2), ...core, ...adv, ...ia_ext, ...wrap.slice(2)];

    grunt.initConfig({
        pkg: pkg,
        banner: grunt.file.read('./src/copy.js').replace(/@VERSION/, pkg.version).replace(/@DATE/, grunt.template.today('yyyy-mm-dd')) + '\n',
        concat: {
            options: {
                banner: '<%= banner %>',
            },
            target: {
                dest: './dist/snap.svg.js',
                src: src,
            },
            bsk: {
                dest: './dist/snap.svg.bsk.js',
                src: src_bsk,
            },
            adv: {
                dest: './dist/snap.svg.adv.js',
                src: src_adv,
            },
        },
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
            bsk: {
                src: '<%= concat.bsk.dest %>',
                dest: './dist/snap.svg.bsk-min.js',
            },
            adv: {
                src: '<%= concat.adv.dest %>',
                dest: './dist/snap.svg.adv-min.js',
            },
        },
        exec: {
            test: {
                command: 'cd test; phantomjs test.js',
            },
            eslint: {
                command: './node_modules/eslint/bin/eslint.js ' + core.join(' '),
            },
        },
        jsdoc: {
            dist: {
                src: ['src/**/*.js'],
                options: {
                    destination: 'doc/reference',
                    configure: 'djsdoc.config.js'
                }
            }
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
    grunt.loadNpmTasks('grunt-jsdoc');

    grunt.registerTask('default',
        [
            // 'exec:eslint',
            'concat', 'terser', 'jsdoc',
            // 'prettify'
        ]);
    grunt.registerTask('lint', ['exec:eslint']);
    grunt.registerTask('test', ['exec:test']);
};