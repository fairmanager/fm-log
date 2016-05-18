"use strict";

const mocha = require( "mocha" );

const afterEach  = mocha.afterEach;
const beforeEach = mocha.beforeEach;
const chalk      = require( "chalk" );
const describe   = mocha.describe;
const it         = mocha.it;
const should     = require( "chai" ).should();

describe( "Logger", function() {
	var log;
	var result;

	var Stream      = require( "stream" ).Writable;
	var logStream   = new Stream();
	logStream.write = function writeHandler( data ) {
		let lines = chalk.stripColor( arguments[ 0 ] );
		lines     = lines.replace( /(\r?\n|\r)$/, "" );
		result    = result.concat( lines.split( "\n" ) );
	};

	beforeEach( function() {
		result = [];
	} );

	describe( "without prefix", function() {
		beforeEach( function() {
			log = require( "../lib/log.js" ).to( logStream ).sync();
		} );

		it( "should log without errors", function() {
			log.info( "!" );
			result.should.have.length( 1 );
			result[ 0 ].should.match( /\d \[INFO  ] !/ );
		} );

		it( "should log multiline", function() {
			log.info( "!\n!" );
			result.length.should.equal( 2 );
			result[ 0 ].should.match( /\d \[INFO  ] !/ );
			result[ 1 ].should.match( /\d          !/ );
		} );

		it( "should indent all log levels properly", function() {
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
		} );

		it( "should create an unprefixed logger", () => {
			log = require( "../lib/log.js" ).module( "" ).to( logStream );
			log.debug( "!" );
			result[ 0 ].should.match( /\d \[DEBUG ] !/ );
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
			done();
		} );

		it( "should log multiline", function( done ) {
			log.info( "!\n!" );
			result.should.have.length( 2 );
			result[ 0 ].should.match( /\d \[INFO  ] \(foo\) !/ );
			result[ 1 ].should.match( /\d                !/ );
			done();
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
			done();
		} );
	} );

	describe( "mixed prefixes", function() {
		it( "should log multiline", function() {
			log = require( "../lib/log.js" ).module( "module" ).to( logStream );
			log = require( "../lib/log.js" ).module( "foo" ).to( logStream );
			log.info( "!\n!" );
			result.length.should.equal( 2 );
			result[ 0 ].should.match( /\d \[INFO  ] \(   foo\) !/ );
			result[ 1 ].should.match( /\d                   !/ );

			log = require( "../lib/log.js" ).to( logStream );
			log.info( "!\n!" );
			result.length.should.equal( 4 );
			result[ 2 ].should.match( /\d \[INFO  ]          !/ );
			result[ 3 ].should.match( /\d                   !/ );
		} );
	} );

	describe( "errors", function() {
		it( "should render them properly", function() {
			log = require( "../lib/log.js" ).module( "module" ).to( logStream );
			log.error( new Error( "boom" ) );
			// TODO: Actually check the output
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

		it( "shouldn't render debug", function() {
			log.debug( "!" );
			result.length.should.equal( 0 );
		} );
		it( "shouldn't render info", function() {
			log.info( "!" );
			result.length.should.equal( 0 );
		} );
		it( "shouldn't render notice", function() {
			log.notice( "!" );
			result.length.should.equal( 0 );
		} );
		it( "shouldn't render warn", function() {
			log.warn( "!" );
			result.length.should.equal( 0 );
		} );
		it( "shouldn't render error", function() {
			log.error( "!" );
			result.length.should.equal( 0 );
		} );
		it( "shouldn't render critical", function() {
			log               = require( "../lib/log.js" );
			log.enableLogging = false;
			log.critical( "!" );
			result.length.should.equal( 0 );
		} );
	} );

	describe( "source tracing", function() {
		it( "should render them properly", function() {
			log = require( "../lib/log.js" ).module( "foo" ).withSource().to( logStream );
			(function source() {
				log.info( "!" );
			})();

			result.length.should.equal( 2 );
			result[ 0 ].should.match( /\d \[INFO  ] \(   foo\) !/ );
			result[ 1 ].should.match( /\d \[INFO  ] \(   foo\)   source@.+?:\d+:\d+/ );
		} );
	} );

	describe( "duplicate messages", function() {
		afterEach( function() {
			// Clear internal repeat count.
			log.info( "---" );
		} );
		it( "should be omitted", function() {
			log = require( "../lib/log.js" ).module( "foo" ).to( logStream );
			log.info( "!" );
			log.info( "!" );
			result.length.should.equal( 1 );
			result[ 0 ].should.match( /\d \[INFO  ] \(   foo\) !/ );
		} );
		it( "should be summarized", function() {
			log = require( "../lib/log.js" ).module( "foo" ).to( logStream );
			log.info( "!" );
			log.info( "!" );
			log.info( "!!" );
			result.length.should.equal( 3 );
			result[ 0 ].should.match( /\d \[INFO  ] \(   foo\) !/ );
			result[ 1 ].should.match( /\d \[INFO  ] \(   foo\) Last message repeated 1 time\./ );
			result[ 2 ].should.match( /\d \[INFO  ] \(   foo\) !!/ );
		} );
		it( "should be summarized with pluralization", function() {
			log = require( "../lib/log.js" ).module( "foo" ).to( logStream );
			log.info( "!" );
			log.info( "!" );
			log.info( "!" );
			log.info( "!!" );
			result.length.should.equal( 3 );
			result[ 0 ].should.match( /\d \[INFO  ] \(   foo\) !/ );
			result[ 1 ].should.match( /\d \[INFO  ] \(   foo\) Last message repeated 2 times\./ );
			result[ 2 ].should.match( /\d \[INFO  ] \(   foo\) !!/ );
		} );
	} );

	// This prefix changes indentation. Test this last, as it affects other test output.
	describe( "default prefix", function() {
		it( "should pick the correct module name", function() {
			log = require( "../lib/log.js" ).module().to( logStream );
			log.info( "!" );
			result.should.have.length( 1 );
			result[ 0 ].should.match( /\d \[INFO  ] \(Logger\) !/ );
		} );
	} );
} );
