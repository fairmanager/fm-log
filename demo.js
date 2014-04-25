var log = require( __dirname + "/lib/log.js" ).module( "demo" );

log.info( "Logging without source tracing" );
log.notice( "Initializing application...\nwow\nsuch application" );
log.critical( new Error( "Logging an Error instance." ) );

log.withSource();
log.info( "Logging WITH source tracing" );
log.notice( "You'll never know where this was logged from!" );

log = require( __dirname + "/lib/log.js" );
log.warn( "We don't need no prefix!" );

log = require( __dirname + "/lib/log.js" ).module( "something weird" );
log.warn( "...or do we?" );

log = require( __dirname + "/lib/log.js" );
log.notice( "You're using a longer prefix? I'll adjust." );

log = require( __dirname + "/lib/log.js" ).module();
log.error( "ouch" );