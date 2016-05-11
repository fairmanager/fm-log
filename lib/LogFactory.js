// jscs:disable requireNamedUnassignedFunctions
"use strict";

const Logger = require( "./Logger" );

class LogFactory {
	constructor() {
		/**
		 * All instantiated loggers.
		 * @type {Array<Logger>}
		 * @private
		 */
		this.__loggers = [];
	}

	/**
	 * Construct a logger for the invoking module.
	 */
	module( moduleName ) {
		if( !moduleName ) {
			const error   = new Error().stack;
			const matches = error.match( /at (?:Context|Object).<anonymous> .*[\\/](.*?):/ );
			if( matches && matches.length >= 2 ) {
				moduleName = matches[ 1 ];
				// Strip file extension
				moduleName = moduleName.replace( /\.[^/.]+$/, "" );
			}
		}
		if( moduleName ) {
			Logger.moduleMaxLength = Math.max( Logger.moduleMaxLength || 0, moduleName.length );
		}
		return new Logger( moduleName );
	}

	/**
	 * Construct a Logger.
	 * @return {Logger}
	 */
	instance( prefix, stream ) {
		const logger = new Logger( prefix, stream );
		this.__loggers.push( logger );
		return logger;
	}
}

module.exports = new LogFactory();
