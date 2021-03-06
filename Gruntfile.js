// Generated on 2013-10-15 using generator-angular 0.3.0
'use strict';
// var logger = require('log4js').getLogger('Gruntfile');
var LIVERELOAD_PORT = 35729;
var lrSnippet = null;
var proxySnippet = null;
var path = require('path');
var _ = require('lodash');
var mountFolder = function (connect, dir) {
    return connect.static(path.resolve(dir));
};

//var gsWhitelabel = require("./backend/gsWhitelabel");

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/**/*.js'
// use this if you want to recursively match all subfolders:
// 'test/spec/**/*.js'

module.exports = function (grunt) {

    // load all grunt tasks
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    // configurable paths
    var yeomanConfig = {
        app: 'app',
        dist: 'dist',
        distBlueprint: 'dist-blueprint',
        artifacts: 'artifacts'
    };

    try {
        yeomanConfig.app = require('./bower.json').appPath || yeomanConfig.app;
    } catch (e) {
    }

    grunt.initConfig({
        reportsBase: process.env.REPORTS_BASE || 'reports',
        yeoman: yeomanConfig,
        availabletasks: {
            help: {
                options: {
                    filter: 'include',
                    tasks: ['default', 'build', 'blueprint', 'buildArtifacts', 'uploadArtifacts', 'analyze']
                }
            }
        },
        watch: {
            coffee: {
                files: ['<%= yeoman.app %>/scripts/**/*.coffee'],
                tasks: ['coffee:dist']
            },
            coffeeTest: {
                files: ['test/spec/**/*.coffee'],
                tasks: ['coffee:test']
            },
            compass: {
                files: ['<%= yeoman.app %>/styles/**/*.{scss,sass}', 'app/bower_components/gs-ui-infra/**/*.scss'],
                tasks: ['compass:server', 'postcss']
            },
            livereload: {
                options: {
                    livereload: LIVERELOAD_PORT
                },
                files: [
                    '<%= yeoman.app %>/**/*.html',
                    '{.tmp,<%= yeoman.app %>}/styles/**/*.css',
                    '{.tmp,<%= yeoman.app %>}/scripts/**/*.js',
                    '!app/bower_components',
                    '<%= yeoman.app %>/images/**/*.{png,jpg,jpeg,gif,webp,svg}'
                ]
            }
        },
        connect: {
            options: {
                port: 9000,
                // Change this to '0.0.0.0' to access the server from outside.
                hostname: 'localhost'
            },
            proxies: [
                {
                    context: '/backend',
                    host: 'localhost',
                    port: 9001,
                    https: false,
                    changeOrigin: false,
                    xforward: false
                }
            ],
            livereload: {
                options: {
                    middleware: function (connect) {
                        return [
                            lrSnippet,
                            proxySnippet,
                            function (req, res, next) {
                                if (req.url.indexOf('/grafana') === 0) {
                                    req.url = req.url.substring('/grafana'.length) || '/';
                                    return connect.static(path.resolve('../grafana-cosmo/src/'))(req, res, next);
                                } else {
                                    next();
                                }
                            },
                            mountFolder(connect, '.tmp'),
                            mountFolder(connect, yeomanConfig.app)
                        ];
                    }
                }
            },
            test: {
                options: {
                    middleware: function (connect) {
                        return [
                            mountFolder(connect, '.tmp')
                        ];
                    }
                }
            },
            dist: {
                options: {
                    middleware: function (connect) {
                        return [
                            proxySnippet,
                            mountFolder(connect, yeomanConfig.dist)
                        ];
                    }
                }
            }
        },
        connectTest: {
            options: {
                port: 9003,
                hostname: 'localhost'
            },
            test: {
                options: {
                    middleware: function (connect) {
                        return [
                            mountFolder(connect, '.tmp'),
                            mountFolder(connect, 'test')
                        ];
                    }
                }
            }
        },
        open: {
            server: {
                url: 'http://localhost:<%= connect.options.port %>'
            }
        },
        clean: {
            dist: {
                files: [
                    {
                        dot: true,
                        src: [
                            '.tmp',
                            '<%= yeoman.dist %>/*',
                            '<%= yeoman.distBlueprint %>/*',
                            '!<%= yeoman.dist %>/.git*',
                            'artifacts'
                        ]
                    }
                ]
            },
            server: '.tmp',
            coverageBackend: ['backend-coverage'],
            coverageFrontend: ['coverage'],
            instrumentBackend: ['backend-instrument'],
            reports: ['reports'],
            doc: ['doc'],
            backendTestResults: ['backend_test_results']
        },
        jsdoc: {
            backend: {
                src: ['backend/**/*.js'],
                options: {
                    destination: '<%= reportsBase %>/backend-doc'
                }
            },
            frontend: {
                src: ['app/scripts/**/*.js'],
                options: {
                    destination: '<%= reportsBase %>/frontend-doc'
                }
            }
        },
        curl: {
            nodejs: {
                src: 'https://nodejs.org/dist/v4.2.0/node-v4.2.0-linux-x64.tar.gz',
                dest: '<%= yeoman.dist %>/node-v4.2.0-linux-x64.tar.gz'
            }

        },
        jshint: {
            options: {
                jshintrc: '.jshintrc',
                reporter: require('jshint-stylish')
            },
            all: [

                '<%= yeoman.app %>/scripts/**/*.js'
            ],
            backend: {
                options: {
                    jshintrc: 'backend/.jshintrc'
                },
                files: {
                    src: [
                        'Gruntfile.js',
                        'backend/**/*.js'
                    ]
                }
            },
            backendMochaTest: {
                options: {
                    jshintrc: 'test/backend/unit/mocha/.jshintrc'
                },
                files: {
                    src: [
                        'test/backend/unit/mocha/**/*.js'
                    ]
                }
            },
            backendJasmineTest: {
                options: {
                    jshintrc: 'test/backend/.jshintrc'
                },
                files: {
                    src: [
                        'test/backend/**/*.js',
                        '!test/backend/unit/mocha/**/*.js'
                    ]
                }
            },
            test: {
                options: {
                    jshintrc: 'test/spec/.jshintrc'
                },
                files: {
                    'src': [
                        'test/spec/**/*.js',
                        '!test/jasmine*/**/*'
                    ]
                }
            }
        },
        jscs: {
            app: {
                src: '<%= yeoman.app %>/scripts/**/*.js',
                options: {
                    config: true
                }
            },
            test: {
                src: 'test/spec/**/*.js',
                options: {
                    config: true
                }
            },
            backend: {
                src: [
                    'Gruntfile.js',
                    'backend/**/*.js'
                ],
                options: {
                    config: true
                }
            },
            backendMochaTest: {
                src: [
                    'test/backend/unit/mocha/**/*.js'
                ],
                options: {
                    config: true
                }
            },
            backendJasmineTest: {
                src: [
                    'test/backend/**/*.js',
                    '!test/backend/unit/mocha/**/*.js'
                ],
                options: {
                    config: true
                }
            }
        },
        sasslint: {
            options: {
                configFile: 'test/spec/.sass-lint.yml'
            },
            target: ['<%= yeoman.app %>/styles/*.scss', '<%= yeoman.app %>/styles/*/*.scss']
        },
        coffee: {
            dist: {
                files: [
                    {
                        expand: true,
                        cwd: '<%= yeoman.app %>/scripts',
                        src: '**/*.coffee',
                        dest: '.tmp/scripts',
                        ext: '.js'
                    }
                ]
            },
            test: {
                files: [
                    {
                        expand: true,
                        cwd: 'test/spec',
                        src: '**/*.coffee',
                        dest: '.tmp/spec',
                        ext: '.js'
                    }
                ]
            }
        },
        compress: {
            blueprint: {
                options: {archive: '<%=yeoman.dist%>/blueprint.tar.gz'},
                files: [
                    {
                        cwd: '<%=yeoman.distBlueprint%>/blueprint',
                        src: ['node-application/**'],
                        expand: true

                    }
                ]

            }

        },

        // Compiles Sass to CSS and generates necessary files if requested
        sass: {

            dist: {
                files: {
                    '.tmp/styles/main.css': '<%= yeoman.app %>/styles/main.scss'
                }
            },
            server: {
                files: {
                    '.tmp/styles/main.css': '<%= yeoman.app %>/styles/main.scss'
                }

            }
        },
        // Post-processing css
        postcss: {
            options: {
                map: true,
                processors: [
                    require('autoprefixer')({browsers: 'last 3 versions'}) // add vendor prefixes according to http://caniuse.com/
                ]
            },
            dist: {
                src: ['.tmp/styles/main.css', '<%= yeoman.dist %>/styles/main.css']
            }
        },
        /* compass: {
         options: {
         sassDir: '<%= yeoman.app %>/styles',
         cssDir: '.tmp/styles',
         generatedImagesDir: '.tmp/images/generated',
         imagesDir: '<%= yeoman.app %>/images',
         javascriptsDir: '<%= yeoman.app %>/scripts',
         fontsDir: '<%= yeoman.app %>/styles/fonts',
         importPath: '<%= yeoman.app %>/bower_components',
         httpImagesPath: '/images',
         httpGeneratedImagesPath: '/images/generated',
         httpFontsPath: '/styles/fonts',
         relativeAssets: false
         },
         dist: {},
         server: {
         options: {
         debugInfo: true
         }
         }
         },*/
        // not used since Uglify task does concat,
        // but still available if needed
        /*concat: {
         dist: {}
         },*/
        rev: {
            dist: {
                files: {
                    src: [
                        '<%= yeoman.dist %>/scripts/**/*.js',
                        '<%= yeoman.dist %>/styles/**/*.css',
                        '<%= yeoman.dist %>/images/**/*.{png,jpg,jpeg,gif,webp,svg}',
                        '<%= yeoman.dist %>/styles/fonts/*'
                    ]
                }
            }
        },
        useminPrepare: {
            html: '<%= yeoman.app %>/index.html',
            options: {
                dest: '<%= yeoman.dist %>'
            }
        },
        usemin: {
            html: ['<%= yeoman.dist %>/**/*.html'],
            css: ['<%= yeoman.dist %>/styles/**/*.css'],
            options: {
                dirs: ['<%= yeoman.dist %>']
            }
        },
        imagemin: {
            dist: {
                files: [
                    {
                        expand: true,
                        cwd: '<%= yeoman.app %>/images',
                        src: '**/*.{png,jpg,jpeg}',
                        dest: '<%= yeoman.dist %>/images'
                    }
                ]
            }
        },
        cssmin: {
            // By default, your `index.html` <!-- Usemin Block --> will take care of
            // minification. This option is pre-configured if you do not wish to use
            // Usemin blocks.
            // dist: {
            //   files: {
            //     '<%= yeoman.dist %>/styles/main.css': [
            //       '.tmp/styles/**/*.css',
            //       '<%= yeoman.app %>/styles/**/*.css'
            //     ]
            //   }
            // }
            options: {processImport: false}
        },
        htmlmin: {
            dist: {
                options: {
                    /*removeCommentsFromCDATA: true,
                     // https://github.com/yeoman/grunt-usemin/issues/44
                     //collapseWhitespace: true,
                     collapseBooleanAttributes: true,
                     removeAttributeQuotes: true,
                     removeRedundantAttributes: true,
                     useShortDoctype: true,
                     removeEmptyAttributes: true,
                     removeOptionalTags: true*/
                },
                files: [
                    {
                        expand: true,
                        cwd: '<%= yeoman.app %>',
                        src: ['*.html', 'views/**/*.html'],
                        dest: '<%= yeoman.dist %>'
                    }
                ]
            }
        },
        // Put files not handled in other tasks here
        copy: {
            artifacts: {
                files: [
                    {
                        expand: true,
                        dot: true,
                        cwd: '<%= yeoman.dist %>',
                        dest: '<%= yeoman.artifacts %>',
                        src: ['cosmo-ui-*.tgz', 'cloudify-ui-*.tgz', 'blueprint.tar.gz'],
                        rename: function (dest, src) {
                            var md = grunt.config.data.cfy.metadata;
                            console.log('renaming ', dest, src);
                            if (src.indexOf('blueprint.tar.gz') >= 0) {
                                return require('path').join(dest, 'ui-blueprint-' + md.buildVersion + '.tar.gz');
                            } else if (src.indexOf('cloudify-ui') >= 0 || src.indexOf('cosmo-ui') >= 0) {
                                return require('path').join(dest, 'cloudify-ui-' + md.buildVersion + '.tgz');
                            }
                        }
                    }
                ]
            },
            blueprint: {
                files: [
                    {
                        expand: true,
                        dot: true,
                        cwd: 'build',
                        dest: '<%= yeoman.distBlueprint %>',
                        src: ['blueprint/**']
                    },
                    {
                        expand: true,
                        dot: true,
                        cwd: '<%= yeoman.dist %>',
                        dest: '<%= yeoman.distBlueprint%>',
                        src: ['cosmo-ui-*.tgz', 'cloudify-ui*.tgz'],
                        rename: function (dest /*, src*/) {
                            return path.join(dest, 'blueprint/node-application', 'app.tgz');
                        }
                    }
                ]
            },
            dist: {
                files: [
                    {
                        expand: true,
                        dot: true,
                        cwd: '<%= yeoman.app %>',
                        dest: '<%= yeoman.dist %>',
                        src: [
                            '*.{ico,png,txt}',
                            '.htaccess',
                            'bower_components/**/*.{ttf,woff,eot,svg,gif,png}',
                            'i18n/**/*.json',
                            'images/**/*.{gif,webp,svg}',
                            'styles/fonts/*'
                        ]
                    },
                    {
                        expand: true,
                        dot: true,
                        cwd: '.',
                        dest: '<%= yeoman.dist %>',
                        src: [
                            '.npmignore',
                            'package.json',
                            'server.js',
                            'backend/**/*',
                            'cosmoui.js',
                            'cosmoui.1',
                            'LICENSE',
                            'VERSION',
                            'logs/*'

                        ]
                    },
                    {
                        expand: true,
                        cwd: '.tmp/images',
                        dest: '<%= yeoman.dist %>/images',
                        src: [
                            'generated/*'
                        ]
                    },
                    {
                        expand: true,
                        flatten: true,
                        nonull: true,
                        dot: true,
                        cwd: '<%= yeoman.app %>/bower_components/gs-ui-infra/assets',
                        dest: '<%= yeoman.dist %>/styles/fonts',
                        src: [
                            '**/*.{ttf,woff,eot,svg}'
                        ]
                    }
                ]
            },
            backendCoverageTests: {
                expand: true,
                dest: 'backend-instrument',
                src: ['test/**/*', 'backend/mock/**/*']
            }
        },
        concurrent: {
            server: [
                'coffee:dist',
                'compass:server'
            ],
            test: [
                'coffee',
                'compass'
            ],
            dist: [
                'coffee',
                'compass:dist',
                'imagemin',
                'htmlmin'
            ],
            mochaTestUnit: [// fix for mochaTest getting stuck..
                'mochaTest:unit'
            ]
        },
        karma: {
            unit: {
                configFile: 'karma.conf.js',
                singleRun: true,
                junitReporter: {outputFile: '<%= reportsBase %>/unit/test-results.xml'},
                coverageReporter: {
                    dir: '<%= reportsBase %>/coverage/',
                    subdir: function (browser) {
                        return browser.toLowerCase().split(/[ /-]/)[0];
                    },
                    reporters: [{type: 'html'}, {type: 'cobertura'}]

                }
            },
            develop: {
                reporters: ['failed'],
                singleRun: true,
                configFile: 'karma.conf.js'
            },
            debug: {
                browsers: ['Chrome'],
                reporters: ['spec'],
                configFile: 'karma.conf.js',
                singleRun: false /** TODO : find how to : 1) tell karma to use chrome from here.. override conf file**/
                /** 2) tell karma to run a single test from here... override conf file **/
            }
        },
        ngmin: {
            dist: {
                files: [
                    {
                        expand: true,
                        cwd: '<%= yeoman.dist %>/scripts',
                        src: '*.js',
                        dest: '<%= yeoman.dist %>/scripts'
                    }
                ]
            }
        },
        uglify: {
            dist: {
                files: {
                    '<%= yeoman.dist %>/scripts/scripts.js': [
                        '<%= yeoman.dist %>/scripts/scripts.js'
                    ]
                }
            }
        },
        /* using istanbul directly since jasmine-node-coverage plugin does not work properly yet...*/
        /* reference: https://github.com/taichi/grunt-istanbul */

        instrument: {
            files: 'backend/**/*.js',
            options: {
                lazy: true,
                basePath: 'backend-instrument/'
            }
        },
        storeCoverage: {
            options: {
                dir: 'backend-coverage/reports'
            }
        },
        makeReport: {
            src: 'backend-coverage/reports/**/*.json',
            options: {
                type: 'html',
                dir: 'backend-coverage/html/reports',
                print: 'detail'
            }
        },
        mochaTest: {
            options: {
                clearRequireCache: true
            },
            unit: {
                options: {
                    reporter: 'xunit-file' // NOTE: this reporter will make task not fail. to see it fail use `develop` goal
                },
                src: ['test/backend/unit/mocha/**/*js']
            },
            develop: {
                options: {
                    reporter: 'spec'
                },
                src: ['test/backend/unit/mocha/**/*js']
            }

        },
        /*jshint camelcase: false */
        mocha_istanbul: {
            coverage: {
                options: {
                    coverageFolder: '<%= reportsBase %>/backend-coverage'
                },
                'src': 'test/backend/unit/mocha/**/*'
            }
        },
        shell: {
            npmPack: {
                command: 'npm pack',
                options: {
                    execOptions: {
                        cwd: '<%= yeoman.dist %>'
                    }
                }
            },
            npmInstallDist: {
                command: 'npm install --production',
                options: {
                    execOptions: {
                        cwd: '<%= yeoman.dist %>'
                    }
                }
            }
        },
        jasmine_node: {
            options: {
                jUnit: {
                    report: true,
                    savePath: 'backend_test_results/',
                    useDotNotation: true,
                    consolidate: true,
                    consolidateAll: true
                }
            },
            unit: ['test/backend/unit/jasmine/'],
            unitInstrument: ['backend-instrument/test/backend/unit/jasmine'],
            integration: ['test/backend/integration/jasmine/']
        },
        html2js: {
            options: {
                base: 'app'
            },
            main: {
                src: ['app/views/**/*.html'],
                dest: '.tmp/viewTemplates/templates.js'
            }
        },
        jscpd: {
            //js: { path: 'app/scripts', output: 'dev/jscpd.js.output.txt' , threshold: 1 },
            //scss: { path: 'app/styles', output: 'dev/jscpd.scss.output.txt' , threshold: 1 },
            //backend: { path: 'backend', output: 'dev/jscpd.backend.output.txt' , threshold: 1 },
            //test: { path: 'test/spec', output: 'dev/jscpd.test.output.txt' , threshold: 1 },
            //testBackend: { path: 'test/backend', output: 'dev/jscpd.testBackend.output.txt' , threshold: 1 },
            all: {
                path: '.',
                output: '<%= reportsBase %>/jscpd/jscpd.output.txt',
                exclude: [
                    '**/*.html',
                    'coverage/**',
                    'build/**',
                    'artifacts/**',
                    'backend-coverage/**',
                    'dist-blueprint/**',
                    'docs/**',
                    'app/bower_components/**',
                    'node_modules/**',
                    'dist/**',
                    'dev/**',
                    'app/styles/SyntaxHighlighter/**',
                    'test/jasmine-standalone-1.3.1/**'
                ],
                threshold: 1
            }
        },
        'jscpdreporter': {
            options: {
                sourcefile: '<%= reportsBase %>/jscpd/jscpd.output.txt',
                outputDir: '<%= reportsBase %>/jscpd/html-report/'
            }
        },
        aws_s3: {
            options: {
                accessKeyId: '<%= aws.accessKey %>', // Use the variables
                secretAccessKey: '<%= aws.secretKey %>', // You can also use env variables
                region: '<%= aws.region %>',
                access: 'public-read',
                uploadConcurrency: 5, // 5 simultaneous uploads
                downloadConcurrency: 5 // 5 simultaneous downloads
            },
            uploadArtifacts: {
                options: {
                    bucket: '<%= aws.bucket %>'
                },
                files: [
                    {
                        dest: '<%= aws.folder %>',
                        cwd: './artifacts',
                        expand: true,
                        src: ['**'],
                        action: 'upload'
                    }
                ]
            }
        }
    });

    grunt.registerTask('server', function (target) {

        proxySnippet = require('grunt-connect-proxy/lib/utils').proxyRequest;

        if (target === 'dist') {
            return grunt.task.run(['configureProxies', 'open', 'connect:dist:keepalive']);
        }
        if (target === 'build_dist') {
            return grunt.task.run(['build', 'configureProxies', 'open', 'connect:dist:keepalive']);
        }
        // guy - moving lines here after build broke.
        // this way : 1) build will not break 2) it will be clearer what broke where

        lrSnippet = require('connect-livereload')({port: LIVERELOAD_PORT});

        grunt.task.run([
            'clean:server',
            'concurrent:server',
            'configureProxies',
            'connect:livereload',
            'open',
            'watch'
        ]);
    });

    grunt.registerTask('analyze', 'analyzes the sources and reports quality problems such as copy-paste', ['jscpd', 'grunt-jscpd-reporter']);

    grunt.registerTask('connectTest', '', []);

    grunt.registerTask('test', function (testBackend) {
        var tasks = [];
        if (testBackend === undefined || testBackend === '' || testBackend === 'all' || testBackend === 'frontend') { // default
            tasks = [
                'jshint',
                'jscs',
                'sasslint',
                'clean:server',
                'concurrent:test',
                'connectTest:test',
                'html2js',
                'karma:unit'
            ];
        }

        if (testBackend === undefined || testBackend === '' || testBackend === 'all' || testBackend === 'backend') {
            // guy - we always use code coverage in grunt.. when debug from the IDE so no need for no instrumented mode in grunt.

            // IMPORTANT: using concurrent to run mochaTest because otherwise grunt will get stuck as we mock modules.
            tasks = tasks.concat(['concurrent:mochaTestUnit', 'mocha_istanbul']);
            //tasks = tasks.concat( ['clean:coverageBackend','instrument', 'copy:backendCoverageTests', /*'jasmine_node:unitInstrument', 'storeCoverage',*/ 'makeReport','clean:instrumentBackend']);
        }
        grunt.task.run(tasks);
    });

    grunt.registerTask('build', 'builds the project', function () {

        var tasks = [
            'verifyNode',
            'clean:server',
            'clean:dist',
            'useminPrepare',
            'concurrent:dist',
            'concat',
            'copy:dist',
            'curl:nodejs',
            'readMetadata',
            'overrideBuildVersion',
            'bundle',
            'ngmin',
            'postcss',
            'cssmin',
            'uglify',
            'rev',
            'usemin',
            'writeBuildDetails'
        ];

        grunt.task.run(tasks);
    });

    grunt.registerTask('pack', 'after `build` will run npm pack on dist folder', [
        'shell:npmInstallDist',
        'shell:npmPack'
    ]);

    grunt.registerTask('bundle', 'A task that bundles all dependencies.', function () {
        // "package" is a reserved word so it's abbreviated to "pkg"
        var pkg = grunt.file.readJSON('dist/package.json');
        // set the bundled dependencies to the keys of the dependencies property
        pkg.bundledDependencies = Object.keys(pkg.dependencies);
        // write back to package.json and indent with two spaces
        grunt.file.write('dist/package.json', JSON.stringify(pkg, undefined, '  '));
    });

    grunt.registerTask('readMetadata', function () {

        // either read version.json file or from environment variables

        var envData = {
            version: process.env.VERSION || '3.3.0',
            prerelease: process.env.PRERELEASE || null,
            build: process.env.BUILD || new Date().getTime()
        };

        var versionFile = process.env.VERSION_JSON || './dev/version.json';

        var fileData = {};
        if (grunt.file.exists(versionFile)) {
            grunt.log.ok('version file exists. reading..');
            fileData = grunt.file.readJSON(versionFile);
        } else {
            grunt.log.ok('version file does not exist. skipping');
        }

        if (!grunt.config.data.cfy) {
            grunt.config.data.cfy = {};
        }

        grunt.config.data.cfy.metadata = _.merge({}, envData, fileData);

        grunt.config.data.cfy.metadata.fullVersion = _.compact([grunt.config.data.cfy.metadata.version, grunt.config.data.cfy.metadata.prerelease]).join('-');

        //
        grunt.config.data.cfy.metadata.buildVersion = _.compact([grunt.config.data.cfy.metadata.version, grunt.config.data.cfy.metadata.prerelease, grunt.config.data.cfy.metadata.build ? 'b' + grunt.config.data.cfy.metadata.build : null]).join('-');

        grunt.log.debug('version data is', grunt.config.data.cfy.version);

    });

    grunt.registerTask('overrideBuildVersion', function () {
        var done = this.async();
        var packageJson = grunt.file.readJSON('dist/package.json');

        if (!process.env.NEW_BUILD) {

            var versionFilename = 'VERSION';
            var buildVersion = null;
            if (grunt.file.exists(versionFilename)) {
                var fs = require('fs');
                buildVersion = grunt.file.readJSON(versionFilename).version;
                grunt.log.ok('build version is ', buildVersion);

                packageJson.version = buildVersion;
                try {
                    fs.writeFile('dist/package.json', JSON.stringify(packageJson, {}, 4), function (err) {
                        if (!!err) {
                            grunt.log.error('writing file failed', err);
                            grunt.fail.fatal('writing version failed');
                        }
                        grunt.log.ok('version changed successfully');
                        done();
                    });
                } catch (e) {
                    grunt.log.error('unable to write build version ', e);
                    grunt.fail.fatal('unable to write build version ');
                }
                grunt.log.ok('build version : ' + buildVersion);
            } else {
                grunt.log.ok(versionFilename + ' does not exist. skipping version manipulation');
            }

        } else {

            packageJson.version = grunt.config.data.cfy.metadata.fullVersion;
            try {
                require('fs').writeFile('dist/package.json', JSON.stringify(packageJson, {}, 4), function (err) {
                    if (!!err) {
                        grunt.log.error('writing file failed', err);
                        grunt.fail.fatal('writing version failed');
                    }
                    grunt.log.ok('version changed successfully');
                    done();
                });
            } catch (e) {
                grunt.log.error('unable to write build version ', e);
                grunt.fail.fatal('unable to write build version ');
            }
            grunt.log.ok('build version : ' + packageJson.version);
        }

    });

    grunt.registerTask('backend', function () {
        grunt.config.set('jshint.options.jshintrc', 'backend/.jshintrc');
        grunt.task.run('jshint:backend');
    });

    /**
     * This task assumes we have a packed artifact
     * run it by running `npm pack blueprint`
     * or if you already ran `npm pack` just run `npm blueprint`
     */
    grunt.registerTask('blueprint', 'a task to run after npm pack in order to construct the blueprint', [
        'copy:blueprint',
        'compress:blueprint'
    ]);

    grunt.registerTask('uploadArtifacts', 'assumes `buildArtifacts` execution. uploads artifacts to amazon and tarzan', [
        'readS3Keys',
        'aws_s3:uploadArtifacts'
    ]);

    /**
     * will output all artifacts : cosmo-ui.tar.gz and blueprint.tgz to folder named artifacts
     */
    grunt.registerTask('buildArtifacts', 'runs build from scratch. outputs ui.tar.gz and blueprint.tar.gz to folder `artifacts`', [
        'default',
        'pack',
        'blueprint',
        'readMetadata',
        'copy:artifacts'
    ]);

    grunt.registerTask('readS3Keys', function () {

        grunt.config.data.aws = {
            'accessKey': process.env.S3_ACCESS_KEY,
            'secretKey': process.env.S3_SECRET_KEY,
            'bucket': process.env.S3_BUCKET,
            'folder': process.env.S3_FOLDER,
            'region': process.env.S3_REGION

        };


    });

    grunt.registerTask('default', 'compiles the project', [
        'jshint',
        'jscs',
        'jsdoc',
        'test:all',
        'build',
        'backend'
    ]);

    grunt.registerTask('writeBuildDetails', function(){
        //cloudify-packager/common/provision.sh
        var done = this.async();

        require('git-rev').long(function (githash) {
            var buildDetails = JSON.stringify({
                githash: githash,
                build_id: process.env.BUILD_ID,
                data: new Date().toString()
            });

            console.log('build details = ', buildDetails);
            require('fs').writeFileSync('dist/BUILD_DETAILS.txt', buildDetails);
            done();
        });




    });

    grunt.registerTask('compass', ['sass']);
    grunt.registerTask('help', ['availabletasks:help']);

    grunt.registerTask('verifyNode', function() {
        var isPassed = true;
        var nodeVersion = grunt.file.read('.nvmrc').trim();
        grunt.log.write('NodeJs version is: '+nodeVersion);
        //verify travis use updated node version
        var travisFile = grunt.file.read('.travis.yml');
        if(travisFile.indexOf(nodeVersion) === -1){
            grunt.log.error('.travis.yml is not using the updated version of node');
            isPassed = false;
        }
        //verify circle use updated node version
        var circleFile = grunt.file.read('circle.yml');
        if(circleFile.indexOf(nodeVersion) === -1){
            grunt.log.error('circle.yml is not using the updated version of node');
            isPassed = false;
        }
        //verify grunt task curl use updated node version
        var gruntNodeTask = grunt.config.get('curl.nodejs');
        if(gruntNodeTask.src.indexOf(nodeVersion) === -1){
            grunt.log.error('Gruntfile curl.nodejs.src is not using the updated version of node');
            isPassed = false;
        }
        if(gruntNodeTask.dest.indexOf(nodeVersion) === -1){
            grunt.log.error('Gruntfile curl.nodejs.dest is not using the updated version of node');
            isPassed = false;
        }

        if(!isPassed){
            grunt.fail.fatal('Please make sure all nodejs dependencies are updated');
        }
    });
};
