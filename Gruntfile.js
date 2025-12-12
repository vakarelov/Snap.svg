module.exports = function (grunt) {

    const pkg = grunt.file.readJSON('package.json');
    const coreRuntime = [
        './src/snap.js',           // Renamed from svg.js - contains core utilities without constructors
        './src/snap-core-ready.js',
    ];

    const coreExtensions = [
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

    const core = [...coreRuntime, ...coreExtensions];

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
        './src/mina.js',
        './src/amd-banner.js',
        './src/amd-footer.js',
    ];

    const snapEsm = [
        './src/esm-snap-preamble.js',
        './src/eve.js',
        './src/mina.js',
        './src/esm-snap-banner.js',
        ...core,
        ...adv,
        ...ia_ext,
        './src/esm-snap-footer.js',
    ];

    const eveEsm = [
        './src/esm-eve-preamble.js',
        './src/eve.js',
        './src/esm-eve-footer.js',
    ];

    const minaEsm = [
        './src/esm-mina-preamble.js',
        './src/mina.js',
        './src/esm-mina-footer.js',
    ];

    const eveCjs = ['./src/eve.js'];
    const minaCjs = ['./src/mina.js'];

    const src_bsk = [...wrap.slice(0, 3), ...core, ...wrap.slice(3)];
    const src_adv = [...wrap.slice(0, 3), ...core, ...adv, ...wrap.slice(3)];
    const src = [...wrap.slice(0, 3), ...core, ...adv, ...ia_ext, ...wrap.slice(3)];

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
            snap_esm_js: {
                options: {
                    sourceMap: true,
                    sourceMapName: './dist/snap.esm.js.map',
                },
                dest: './dist/snap.esm.js',
                src: snapEsm,
            },
            snap_esm_mjs: {
                options: {
                    sourceMap: true,
                    sourceMapName: './dist/snap.esm.mjs.map',
                },
                dest: './dist/snap.esm.mjs',
                src: snapEsm,
            },
            eve_esm_js: {
                options: {
                    sourceMap: true,
                    sourceMapName: './dist/eve.esm.js.map',
                },
                dest: './dist/eve.esm.js',
                src: eveEsm,
            },
            eve_esm_mjs: {
                options: {
                    sourceMap: true,
                    sourceMapName: './dist/eve.esm.mjs.map',
                },
                dest: './dist/eve.esm.mjs',
                src: eveEsm,
            },
            mina_esm_js: {
                options: {
                    sourceMap: true,
                    sourceMapName: './dist/mina.esm.js.map',
                },
                dest: './dist/mina.esm.js',
                src: minaEsm,
            },
            mina_esm_mjs: {
                options: {
                    sourceMap: true,
                    sourceMapName: './dist/mina.esm.mjs.map',
                },
                dest: './dist/mina.esm.mjs',
                src: minaEsm,
            },
            eve_cjs: {
                options: {
                    sourceMap: true,
                    sourceMapName: './dist/eve.cjs.js.map',
                },
                dest: './dist/eve.cjs.js',
                src: eveCjs,
            },
            mina_cjs: {
                options: {
                    sourceMap: true,
                    sourceMapName: './dist/mina.cjs.js.map',
                },
                dest: './dist/mina.cjs.js',
                src: minaCjs,
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
            snap_esm_js: {
                options: {
                    sourceMap: {
                        filename: './dist/snap.esm.min.js.map',
                        url: 'snap.esm.min.js.map',
                    },
                },
                src: '<%= concat.snap_esm_js.dest %>',
                dest: './dist/snap.esm.min.js',
            },
            snap_esm_mjs: {
                options: {
                    sourceMap: {
                        filename: './dist/snap.esm.min.mjs.map',
                        url: 'snap.esm.min.mjs.map',
                    },
                },
                src: '<%= concat.snap_esm_mjs.dest %>',
                dest: './dist/snap.esm.min.mjs',
            },
            eve_esm_js: {
                options: {
                    sourceMap: {
                        filename: './dist/eve.esm.min.js.map',
                        url: 'eve.esm.min.js.map',
                    },
                },
                src: '<%= concat.eve_esm_js.dest %>',
                dest: './dist/eve.esm.min.js',
            },
            eve_esm_mjs: {
                options: {
                    sourceMap: {
                        filename: './dist/eve.esm.min.mjs.map',
                        url: 'eve.esm.min.mjs.map',
                    },
                },
                src: '<%= concat.eve_esm_mjs.dest %>',
                dest: './dist/eve.esm.min.mjs',
            },
            mina_esm_js: {
                options: {
                    sourceMap: {
                        filename: './dist/mina.esm.min.js.map',
                        url: 'mina.esm.min.js.map',
                    },
                },
                src: '<%= concat.mina_esm_js.dest %>',
                dest: './dist/mina.esm.min.js',
            },
            mina_esm_mjs: {
                options: {
                    sourceMap: {
                        filename: './dist/mina.esm.min.mjs.map',
                        url: 'mina.esm.min.mjs.map',
                    },
                },
                src: '<%= concat.mina_esm_mjs.dest %>',
                dest: './dist/mina.esm.min.mjs',
            },
            eve_cjs: {
                options: {
                    sourceMap: {
                        filename: './dist/eve.cjs.min.js.map',
                        url: 'eve.cjs.min.js.map',
                    },
                },
                src: '<%= concat.eve_cjs.dest %>',
                dest: './dist/eve.cjs.min.js',
            },
            mina_cjs: {
                options: {
                    sourceMap: {
                        filename: './dist/mina.cjs.min.js.map',
                        url: 'mina.cjs.min.js.map',
                    },
                },
                src: '<%= concat.mina_cjs.dest %>',
                dest: './dist/mina.cjs.min.js',
            },
        },
        exec: {
            test: {
                command: 'cd test; phantomjs test.js',
            },
            eslint: {
                command: './node_modules/eslint/bin/eslint.js ' + core.join(' '),
            },
            jsdoc_json: {
                command: 'if not exist doc\\json mkdir doc\\json && npx jsdoc -X -c djsdoc.config.js -r src > doc\\json\\documentation.json',
            },
            build_tutorials: {
                command: 'node demos/Tutorial_new/build-tutorials.js',
            },
        },
        jsdoc: {
            dist: {
                src: ['src/**/*.js'],
                options: {
                    destination: 'doc/reference',
                    configure: 'djsdoc.config.js',
                    excludePattern: '(^|\\/)(esm-.*\\.js)$'
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
            'exec:build_tutorials',
            'concat', 'terser', 'jsdoc', 'exec:jsdoc_json',
            // 'prettify'
        ]);
    grunt.registerTask('lint', ['exec:eslint']);
    grunt.registerTask('test', ['exec:test']);
    grunt.registerTask('docs:json', ['exec:jsdoc_json']);
};