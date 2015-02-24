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

			watch : {
				files : [ "lib/*.js" ],
				tasks : [ "jshint" ]
			}
		}
	);

	grunt.loadNpmTasks( "grunt-contrib-jshint" );
	grunt.loadNpmTasks( "grunt-contrib-watch" );

	grunt.registerTask( "default", [ "jshint" ] );
};
