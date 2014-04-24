var should = require( 'should' );

describe( "Logger", function() {
  var log;
  var consoleLogOrig = console.log;
  var consoleLog = console.log;
  var result;
  beforeEach( function() {
    log = require( "../lib/log.js" );
    consoleLog = function() {
      result = arguments;
      consoleLogOrig.apply( console, arguments );
    };
    console.log = consoleLog;
  } );
  afterEach( function() {
    consoleLog = consoleLogOrig;
  } );

  it( "should log without errors", function() {
    log.info( "!" );
    result[0].should.match( /\[INFO  \] !/ );
  } );

  it( "should log multiline", function() {
    log.info( "!\n!" );
    result.length.should.equal( 1 );
    result[0].should.match( /\[INFO  \] !/ );
  } );

  it( "should indent all log levels properly", function() {
    log.verbose("!");
    result[0].should.match( /\[DEBUG \] !/ );
    log.info("!");
    result[0].should.match( /\[INFO  \] !/ );
    log.notice("!");
    result[0].should.match( /\[NOTICE\] !/ );
    log.warn("!");
    result[0].should.match( /\[WARN  \] !/ );
    log.error("!");
    result[0].should.match( /\[ERROR \] !/ );
    log.critical("!");
    result[0].should.match( /\[CRITIC\] !/ );
  } );

} );