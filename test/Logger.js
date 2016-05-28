"use strict";

const mocha = require( "mocha" );

const after      = mocha.after;
const afterEach  = mocha.afterEach;
const beforeEach = mocha.beforeEach;
const chalk      = require( "chalk" );
const describe   = mocha.describe;
const it         = mocha.it;
const should     = require( "chai" ).should();

describe( "Logger", () => {
	let log;
	let result;

	const Stream    = require( "stream" ).Writable;
	const logStream = new Stream();
	logStream.write = function writeHandler( data ) {
		let lines = chalk.stripColor( arguments[ 0 ] );
		lines     = lines.replace( /(\r?\n|\r)$/, "" );
		result    = result.concat( lines.split( "\n" ) );
	};

	beforeEach( () => {
		result = [];
	} );

	describe( "without prefix", () => {
		beforeEach( () => {
			log = require( "../lib/log.js" ).to( logStream ).sync();
		} );

		it( "should log without errors", () => {
			log.info( "!" );
			result.should.have.length( 1 );
			result[ 0 ].should.match( /\d \[INFO  ] !/ );
		} );

		it( "should log multiline", () => {
			log.info( "!\n!" );
			result.length.should.equal( 2 );
			result[ 0 ].should.match( /\d \[INFO  ] !/ );
			result[ 1 ].should.match( /\d          !/ );
		} );

		it( "should indent all log levels properly", () => {
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

	describe( "with prefix", () => {
		beforeEach( () => {
			log = require( "../lib/log.js" ).module( "foo" ).to( logStream );
		} );

		it( "should log without errors", done => {
			log.info( "!" );
			result.should.have.length( 1 );
			result[ 0 ].should.match( /\d \[INFO  ] \(foo\) !/ );
			done();
		} );

		it( "should log multiline", done => {
			log.info( "!\n!" );
			result.should.have.length( 2 );
			result[ 0 ].should.match( /\d \[INFO  ] \(foo\) !/ );
			result[ 1 ].should.match( /\d                !/ );
			done();
		} );

		it( "should indent all log levels properly", done => {
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

	describe( "mixed prefixes", () => {
		it( "should log multiline", () => {
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

	describe( "errors", () => {
		it( "should render them properly", () => {
			log = require( "../lib/log.js" ).module( "module" ).to( logStream );
			log.error( new Error( "boom" ) );
			// TODO: Actually check the output
		} );
	} );

	describe( "disabled logging", () => {
		beforeEach( () => {
			log               = require( "../lib/log.js" ).to( logStream );
			log.enableLogging = false;
		} );
		afterEach( () => {
			log.enableLogging = true;
		} );

		it( "shouldn't render debug", () => {
			log.debug( "!" );
			result.length.should.equal( 0 );
		} );
		it( "shouldn't render info", () => {
			log.info( "!" );
			result.length.should.equal( 0 );
		} );
		it( "shouldn't render notice", () => {
			log.notice( "!" );
			result.length.should.equal( 0 );
		} );
		it( "shouldn't render warn", () => {
			log.warn( "!" );
			result.length.should.equal( 0 );
		} );
		it( "shouldn't render error", () => {
			log.error( "!" );
			result.length.should.equal( 0 );
		} );
		it( "shouldn't render critical", () => {
			log               = require( "../lib/log.js" );
			log.enableLogging = false;
			log.critical( "!" );
			result.length.should.equal( 0 );
		} );
	} );

	describe( "source tracing", () => {
		it( "should render them properly", () => {
			log = require( "../lib/log.js" ).module( "foo" ).withSource().to( logStream );
			(function source() {
				log.info( "!" );
			})();

			result.length.should.equal( 2 );
			result[ 0 ].should.match( /\d \[INFO  ] \(   foo\) !/ );
			result[ 1 ].should.match( /\d \[INFO  ] \(   foo\)   source@.+?:\d+:\d+/ );
		} );
	} );

	describe( "duplicate messages", () => {
		afterEach( () => {
			// Clear internal repeat count.
			log.info( "---" );
		} );

		it( "should be omitted", () => {
			log = require( "../lib/log.js" ).module( "foo" ).to( logStream );
			log.info( "!" );
			log.info( "!" );
			result.length.should.equal( 1 );
			result[ 0 ].should.match( /\d \[INFO  ] \(   foo\) !/ );
		} );

		it( "should be summarized", () => {
			log = require( "../lib/log.js" ).module( "foo" ).to( logStream );
			log.info( "!" );
			log.info( "!" );
			log.info( "!!" );
			result.length.should.equal( 3 );
			result[ 0 ].should.match( /\d \[INFO  ] \(   foo\) !/ );
			result[ 1 ].should.match( /\d \[INFO  ] \(   foo\) Last message repeated 1 time\./ );
			result[ 2 ].should.match( /\d \[INFO  ] \(   foo\) !!/ );
		} );

		it( "should be summarized with pluralization", () => {
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

		it( "should be summarized repeatedly", () => {
			log = require( "../lib/log.js" ).module( "foo" ).to( logStream );
			log.info( "!" );
			log.info( "!" );
			log.info( "!!" );
			log.info( "!!" );
			log.info( "-" );
			result.length.should.equal( 5 );
			result[ 0 ].should.match( /\d \[INFO  ] \(   foo\) !/ );
			result[ 1 ].should.match( /\d \[INFO  ] \(   foo\) Last message repeated 1 time\./ );
			result[ 2 ].should.match( /\d \[INFO  ] \(   foo\) !!/ );
			result[ 3 ].should.match( /\d \[INFO  ] \(   foo\) Last message repeated 1 time\./ );
		} );
	} );

	// This prefix changes indentation. Test this last, as it affects other test output.
	describe( "default prefix", () => {
		it( "should pick the correct module name", () => {
			log = require( "../lib/log.js" ).module().to( logStream );
			log.info( "!" );
			result.should.have.length( 1 );
			result[ 0 ].should.match( /\d \[INFO  ] \(Logger\) !/ );
		} );
	} );

	describe( "silence", () => {
		after( () => {
			require( "../lib/log.js" ).logFactory.silence( false );
		} );

		it( "shouldn't log when silenced", () => {
			log = require( "../lib/log.js" ).module( "" ).to( logStream ).off();
			log.info( "!" );
			result.should.have.length( 0 );
		} );

		it( "shouldn't log when globally silenced", () => {
			require( "../lib/log.js" ).logFactory.silence();
			log = require( "../lib/log.js" ).module( "" ).to( logStream );
			log.info( "!" );
			result.should.have.length( 0 );
		} );
	} );

	describe( "level requirements", () => {
		beforeEach( () => {
			log = require( "../lib/log.js" ).module( "" ).to( logStream );
		} );

		after( () => {
			require( "../lib/log.js" ).logFactory.require();
		} );

		it( "should not log when level is below min", () => {
			const LogLevels = require( "../lib/LogLevels" );
			log.require( LogLevels.ERROR );
			log.debug( "!" );
			result.should.have.length( 0 );
		} );

		it( "should not log when global level is below min", () => {
			const LogLevels = require( "../lib/LogLevels" );
			require( "../lib/log.js" ).logFactory.require( LogLevels.ERROR );
			log.debug( "!" );
			result.should.have.length( 0 );
		} );

		it( "should log when level is at min", () => {
			const LogLevels = require( "../lib/LogLevels" );
			log.require( LogLevels.INFO );
			log.info( "!" );
			result.should.have.length( 1 );
			result[ 0 ].should.match( /\d \[INFO  ] \(   foo\) !/ );
		} );
	} );
} );
