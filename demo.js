// Grab module name automatically
log = require( __dirname + "/lib/log.js" ).module();
log.error( "ouch" );

// Basic logging
log = require( __dirname + "/lib/log.js" ).module( "demo" );
log.notice( "Initializing application...\nwow\nsuch application" );
log.critical( new Error( "Logging an Error instance." ) );

// Logging with source trace
log.withSource();
log.verbose( "Logging WITH source tracing" );
log.notice( "You'll never know where this was logged from!" );

// No prefix
log = require( __dirname + "/lib/log.js" );
log.warn( "We don't need no prefix!" );

// Adjusting to longer prefix
log = require( __dirname + "/lib/log.js" ).module( "something weird" );
log.warn( "...or do we?" );
log = require( __dirname + "/lib/log.js" );
log.notice( "You're using a longer prefix? I'll adjust." );