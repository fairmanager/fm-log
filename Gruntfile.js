module.exports = function( grunt ) {

	// Project configuration.
	grunt.initConfig(
		{
			pkg : grunt.file.readJSON( "package.json" ),

			jshint : {
				options : {
					jshintrc : true
				},
				lib     : {
					src : [
						"lib/*.js"
					]
				}
			},

			jscs : {
				src     : [
					"lib/*.js"
				],
				options : {
					config  : ".jscsrc",
					verbose : true
				}
			},

			mocha_istanbul : {// jscs:ignore requireCamelCaseOrUpperCaseIdentifiers
				coverage  : {
					src : "test"
				},
				coveralls : {
					src     : "test",
					options : {
						coverage      : true,
						root          : "./lib",
						reportFormats : [ "cobertura", "lcovonly" ]
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

		require( "coveralls" ).handleInput( lcov, function( err ) {
			if( err ) {
				return done( err );
			}
			done();
		} );
	} );

	grunt.loadNpmTasks( "grunt-jscs" );
	grunt.loadNpmTasks( "grunt-contrib-jshint" );
	grunt.loadNpmTasks( "grunt-contrib-watch" );
	grunt.loadNpmTasks( "grunt-mocha-istanbul" );

	grunt.registerTask( "coveralls", [ "mocha_istanbul:coveralls" ] );
	grunt.registerTask( "coverage", [ "mocha_istanbul:coverage" ] );
	grunt.registerTask( "default", [ "jshint", "jscs" ] );
};
