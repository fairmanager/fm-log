"use strict";

const mocha = require( "mocha" );

const chalk    = require( "chalk" );
const describe = mocha.describe;
const it       = mocha.it;
const should   = require( "chai" ).should();

describe( "MessageFormatter", () => {
	const MessageFormatter = require( "../lib/MessageFormatter" );

	it( "should pad properly", () => {
		MessageFormatter.pad( "" ).should.equal( "00" );
		MessageFormatter.pad( "1" ).should.equal( "01" );
		MessageFormatter.pad( "11" ).should.equal( "11" );

		MessageFormatter.pad( "", 2 ).should.equal( "00" );
		MessageFormatter.pad( "1", 2 ).should.equal( "01" );
		MessageFormatter.pad( "11", 2 ).should.equal( "11" );

		MessageFormatter.pad( "1", 3 ).should.equal( "001" );
		MessageFormatter.pad( "11", 3 ).should.equal( "011" );
		MessageFormatter.pad( "111", 3 ).should.equal( "111" );
	} );

	it( "should format a date as expected", () => {
		const date      = new Date( "Wed Dec 14 2016 16:48:07 GMT+0100 (W. Europe Standard Time)" );
		const formatted = MessageFormatter.formatDate( date );
		formatted.should.match(  /\d\d\d\d-\d\d-\d\d \d\d:\d\d:\d\d\.\d\d\d/ );
	} );
} );
