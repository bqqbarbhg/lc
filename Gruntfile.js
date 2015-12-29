module.exports = function(grunt) {

	grunt.initConfig({

		pkg: grunt.file.readJSON('package.json'),

		concat: {
			options: {
				separator: ';\n',
				banner: '(function(){\n',
				footer: '\n})();'
			},
			dist: {
				src: [
					'bower_components/fetch/fetch.js',
					'src/client/math.js',
					'src/client/content.js',
					'src/client/render.js',
					'src/client/game.js',
					'src/client/game_render.js',
					'src/client/main.js',
				],
				dest: 'build/lc.concat.js',
			},
		},

		jshint: {
			files: ['src/client/**/*.js'],
			options: {
				esnext: true
			}
		},

		babel: {
			options: {
				sourceMap: true,
				presets: ['babel-preset-es2015']
			},
			dist: {
				files: {
					'build/lc.js': ['build/lc.concat.js']
				}
			}
		},

		uglify: {
			my_target: {
				files: {
					'dist/js/lc.js': 'build/lc.js'
				}
			}
		},

		watch: {
			scripts: {
				files: ['src/client/**/*.js'],
				tasks: ['jshint', 'concat', 'babel', 'uglify']
			}
		}

	});

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-babel');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask('default', ['watch']);
};
