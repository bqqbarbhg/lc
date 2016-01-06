module.exports = function(grunt) {

	var js_sources = [
		'src/js/vendor/fetch/fetch.js',
		'src/js/client/math.js',
		'src/js/client/content.js',
		'src/js/client/render.js',
		'src/js/client/main.js',
	];

	grunt.initConfig({

		pkg: grunt.file.readJSON('package.json'),

		copy: {
			html: {
				expand: true,
				cwd: 'src/html/',
				src: '**/*.html',
				dest: 'dist/'
			}
		},

		concat: {
			release: {
				options: {
					separator: ';\n',
					banner: '(function(){\n',
					footer: '\n})();'
				},
				src: js_sources,
				dest: 'build/lc.concat.js',
			},

			dev: {
				options: {
					separator: ';\n',
					banner: '(function(){\n',
					footer: '\n})();'
				},
				src: js_sources,
				dest: 'dist/js/lc.js',
			}
		},

		jshint: {
			files: ['src/js/client/**/*.js'],
			options: {
				esnext: true
			}
		},

		babel: {
			options: {
				presets: ['babel-preset-es2015']
			},
			dist: {
				files: {
					'build/lc.js': ['build/lc.concat.js']
				}
			}
		},

		uglify: {
			release: {
				files: {
					'dist/js/lc.js': 'build/lc.js'
				}
			}
		},

		concurrent: {
			options: {
				logConcurrentOutput: true
			},

			dev: {
				tasks: ['watch:dev', 'watch:html']
			},
			
			release: {
				tasks: ['watch:release', 'watch:html']
			}
		},

		watch: {
			release: {
				files: ['src/js/client/**/*.js'],
				tasks: ['jshint', 'concat:release', 'babel', 'uglify:release']
			},

			dev: {
				files: ['src/js/client/**/*.js'],
				tasks: ['jshint', 'concat:dev']

			},

			html: {
				files: ['src/html/**/*.html'],
				tasks: ['copy:html']
			}
		}

	});

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-babel');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-concurrent');

	grunt.registerTask('default', ['copy:html', 'jshint', 'concat:release', 'babel', 'uglify:release']);
	grunt.registerTask('dev', ['copy:html', 'jshint', 'concat:dev', 'concurrent:dev'])
	grunt.registerTask('release', ['copy:html', 'jshint', 'concat:release', 'babel', 'uglify:release', 'concurrent:release']);
};