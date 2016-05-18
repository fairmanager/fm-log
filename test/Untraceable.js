"use strict";

const mocha = require( "mocha" );

const afterEach  = mocha.afterEach;
const beforeEach = mocha.beforeEach;
const chalk      = require( "chalk" );
const describe   = mocha.describe;
const it         = mocha.it;
const should     = require( "chai" ).should();

describe( "Untraceable", () => {

	it( "should render as the contained message", () => {
		const Untraceable = require( "../lib/Untraceable" );
		const u           = new Untraceable( "foo" );
		u.message.should.equal( "foo" );
		u.toString().should.equal( "foo" );
	} );
} );
