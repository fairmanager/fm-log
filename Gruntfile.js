module.exports = grunt => {

	// Project configuration.
	grunt.initConfig(
		{
			pkg : grunt.file.readJSON( "package.json" ),

			eslint : {
				target : [
					"lib/*.js"
				]
			},

			// eslint-disable-next-line camelcase
			mocha_istanbul : {
				coverage : {
					src     : "test",
					options : {
						coverage      : true,
						root          : "./lib",
						reportFormats : [ "lcov" ]
					}
				}
			},

			watch : {
				files : [ "lib/*.js" ],
				tasks : [ "jshint" ]
			}
		}
	);

	grunt.event.on( "coverage", function onCoverageReceived( lcovFileContents, done ) {
		if( !process.env.TRAVIS ) {
			return done();
		}

		require( "coveralls" ).handleInput( lcovFileContents, function( err ) {
			if( err ) {
				return done( err );
			}
			done();
		} );
	} );

	grunt.loadNpmTasks( "grunt-eslint" );
	grunt.loadNpmTasks( "grunt-contrib-watch" );
	grunt.loadNpmTasks( "grunt-mocha-istanbul" );

	grunt.registerTask( "test", [ "mocha_istanbul:coverage" ] );
	grunt.registerTask( "default", [ "eslint" ] );
};
