var assert = require( "assert" );
var log = require("../lib/log.js");

describe( "Logger", function(){
  it( "should log", function(){
    log.info("test");
  });
  it( "should log multiline", function(){
    log.info("test\ntest");
  });
});