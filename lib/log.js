"use strict";

const logFactory = require( "./LogFactory" );

// Legacy exports
module.exports        = logFactory.instance();
module.exports.module = logFactory.module.bind( logFactory );
module.exports.to     = stream => logFactory.instance().to( stream );

module.exports.logFactory       = logFactory;
module.exports.Logger           = require( "./Logger" );
module.exports.LogLevels        = require( "./LogLevels" );
module.exports.MessageFormatter = require( "./MessageFormatter" );
module.exports.Untraceable      = require( "./Untraceable" );
