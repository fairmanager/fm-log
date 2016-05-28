"use strict";

const mocha = require( "mocha" );

const chalk      = require( "chalk" );
const describe   = mocha.describe;
const it         = mocha.it;
const should     = require( "chai" ).should();

describe( "LogLevels", () => {

	it( "should render correctly", () => {
		const LogLevels = require( "../lib/LogLevels" );
		LogLevels.render( LogLevels.DEBUG ).should.equal( "DEBUG" );
		LogLevels.render( LogLevels.INFO ).should.equal( "INFO" );
		LogLevels.render( LogLevels.NOTICE ).should.equal( "NOTICE" );
		LogLevels.render( LogLevels.WARN ).should.equal( "WARN" );
		LogLevels.render( LogLevels.ERROR ).should.equal( "ERROR" );
		LogLevels.render( LogLevels.CRITICAL ).should.equal( "CRITIC" );
	} );
} );
