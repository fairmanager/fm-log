var chalk  = require( "chalk" );
var should = require( "should" );

describe( "Logger", function() {
	var log;
	var result;

	var Stream      = require( "stream" ).Writable;
	var logStream   = new Stream();
	logStream.write = function writeHandler( data ) {
		result.push( chalk.stripColor( arguments[ 0 ] ) );
	};

	beforeEach( function() {
		result = [];
	} );

	describe( "without prefix", function() {
		beforeEach( function() {
			log = require( "../lib/log.js" ).to( logStream );
		} );

		it( "should log without errors", function( done ) {
			log.info( "!" );
			result[ 0 ].should.match( /\d \[INFO  ] !/ );
			setTimeout( done, 200 );
		} );

		it( "should log multiline", function( done ) {
			log.info( "!\n!" );
			result.length.should.equal( 2 );
			result[ 0 ].should.match( /\d \[INFO  ] !/ );
			result[ 1 ].should.match( /\d          !/ );
			setTimeout( done, 200 );
		} );

		it( "should indent all log levels properly", function( done ) {
			log.debug( "!" );
			result[ 0 ].should.match( /\d \[DEBUG ] !/ );
			log.info( "!" );
			result[ 1 ].should.match( /\d \[INFO  ] !/ );
			log.notice( "!" );
			result[ 2 ].should.match( /\d \[NOTICE] !/ );
			log.warn( "!" );
			result[ 3 ].should.match( /\d \[WARN  ] !/ );
			log.error( "!" );
			result[ 4 ].should.match( /\d \[ERROR ] !/ );
			log.critical( "!" );
			result[ 5 ].should.match( /\d \[CRITIC] !/ );
			setTimeout( done, 200 );
		} );
	} );

	describe( "with prefix", function() {
		beforeEach( function() {
			log = require( "../lib/log.js" ).module( "foo" ).to( logStream );
		} );

		it( "should log without errors", function( done ) {
			log.info( "!" );
			result.should.have.length( 1 );
			result[ 0 ].should.match( /\d \[INFO  ] \(foo\) !/ );
			setTimeout( done, 200 );
		} );

		it( "should log multiline", function( done ) {
			log.info( "!\n!" );
			result.should.have.length( 2 );
			result[ 0 ].should.match( /\d \[INFO  ] \(foo\) !/ );
			result[ 1 ].should.match( /\d                !/ );
			setTimeout( done, 200 );
		} );

		it( "should indent all log levels properly", function( done ) {
			log.debug( "!" );
			result[ 0 ].should.match( /\d \[DEBUG ] \(foo\) !/ );
			log.info( "!" );
			result[ 1 ].should.match( /\d \[INFO  ] \(foo\) !/ );
			log.notice( "!" );
			result[ 2 ].should.match( /\d \[NOTICE] \(foo\) !/ );
			log.warn( "!" );
			result[ 3 ].should.match( /\d \[WARN  ] \(foo\) !/ );
			log.error( "!" );
			result[ 4 ].should.match( /\d \[ERROR ] \(foo\) !/ );
			log.critical( "!" );
			result[ 5 ].should.match( /\d \[CRITIC] \(foo\) !/ );
			setTimeout( done, 200 );
		} );
	} );

	describe( "mixed prefixes", function() {
		it( "should log multiline", function( done ) {
			log = require( "../lib/log.js" ).module( "module" ).to( logStream );
			log = require( "../lib/log.js" ).module( "foo" ).to( logStream );
			log.info( "!\n!" );
			result.length.should.equal( 2 );
			result[ 0 ].should.match( /\d \[INFO  ] \(   foo\) !/ );
			result[ 1 ].should.match( /\d                   !/ );

			log = require( "../lib/log.js" );
			log.info( "!\n!" );
			result.length.should.equal( 4 );
			result[ 2 ].should.match( /\d \[INFO  ]          !/ );
			result[ 3 ].should.match( /\d                   !/ );
			setTimeout( done, 200 );
		} );
	} );

	describe( "errors", function() {
		it( "should render them properly", function( done ) {
			log = require( "../lib/log.js" ).module( "module" );
			log.error( new Error( "boom" ) );
			setTimeout( done, 200 );
		} );
	} );

	describe( "disabled logging", function() {
		beforeEach( function() {
			log               = require( "../lib/log.js" ).to( logStream );
			log.enableLogging = false;
		} );
		afterEach( function() {
			log.enableLogging = true;
		} );

		it( "shouldn't render debug", function( done ) {
			log.debug( "!" );
			result.length.should.equal( 0 );
			setTimeout( done, 200 );
		} );
		it( "shouldn't render info", function( done ) {
			log.info( "!" );
			result.length.should.equal( 0 );
			setTimeout( done, 200 );
		} );
		it( "shouldn't render notice", function( done ) {
			log.notice( "!" );
			result.length.should.equal( 0 );
			setTimeout( done, 200 );
		} );
		it( "shouldn't render warn", function( done ) {
			log.warn( "!" );
			result.length.should.equal( 0 );
			setTimeout( done, 200 );
		} );
		it( "shouldn't render error", function( done ) {
			log.error( "!" );
			result.length.should.equal( 0 );
			setTimeout( done, 200 );
		} );
		it( "shouldn't render critical", function( done ) {
			log               = require( "../lib/log.js" );
			log.enableLogging = false;
			log.critical( "!" );
			result.length.should.equal( 0 );
			setTimeout( done, 200 );
		} );
	} );

	describe( "source tracing", function() {
		it( "should render them properly", function( done ) {
			log = require( "../lib/log.js" ).module( "foo" ).withSource().to( logStream );
			log.info( "!" );
			result.length.should.equal( 2 );
			result[ 0 ].should.match( /\d \[INFO  ] \(   foo\) !/ );
			result[ 1 ].should.match( /\d \[INFO  ] \(   foo\)   Context.<anonymous> \(.+?:\d+:\d+/ );
			setTimeout( done, 200 );
		} );
	} );

} );
