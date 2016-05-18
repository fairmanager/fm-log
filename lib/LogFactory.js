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
	 * @param {String} [moduleName] The name to use for the logger. If none is provided, it will be determined automatically.
	 * @param {Stream} [stream] The stream to write to.
	 */
	module( moduleName, stream ) {
		if( !moduleName && moduleName !== "" ) {
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
		return this.instance( moduleName, stream );
	}

	/**
	 * Construct a Logger.
	 * @return {Logger}
	 */
	instance( prefix, stream ) {
		const logger = new Logger( prefix, stream );
		logger.enableLogging = !this.isSilent;
		this.__loggers.push( logger );
		return logger;
	}

	silence( beSilent ) {
		beSilent = beSilent || true;

		LogFactory.isSilent = beSilent;
		this.__loggers.forEach( logger => {
			logger.enableLogging = !beSilent;
		} );
	}
}

module.exports = new LogFactory();
