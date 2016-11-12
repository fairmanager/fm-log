"use strict";

const Logger    = require( "./Logger" );
const LogLevels = require( "./LogLevels" );

class LogFactory {
	constructor() {
		/**
		 * All instantiated loggers.
		 * @type {Array<Logger>}
		 * @private
		 */
		this.__loggers = [];

		this.isSilent = false;

		this.minLevel = LogLevels.DEBUG;
	}

	/**
	 * Construct a logger for the invoking module.
	 * @param {String} [moduleName] The name to use for the logger. If none is provided, it will be determined automatically.
	 * @param {Stream} [stream] The stream to write to.
	 */
	module( moduleName, stream ) {
		if( !moduleName && moduleName !== "" ) {
			const error   = new Error().stack;
			const matches = error.match( /at (?:Context|Object)\.(?:<anonymous>|\w+) .*[\\/](.*?):/ );
			if( matches && matches.length >= 2 ) {
				moduleName = matches[ 1 ];
				// Strip file extension
				moduleName = moduleName.replace( /\.[^/.]+$/, "" );
			}
		}
		return this.instance( moduleName, stream );
	}

	/**
	 * Construct a Logger.
	 * @return {Logger}
	 */
	instance( prefix, stream ) {
		const logger         = new Logger( prefix, stream || this.__defaultStream );
		logger.enableLogging = !this.isSilent;
		logger.__minLevel    = this.minLevel;
		this.__loggers.push( logger );
		return logger;
	}

	silence( beSilent ) {
		beSilent = typeof beSilent === "undefined";

		this.isSilent = beSilent;
		this.__loggers.forEach( logger => {
			logger.enableLogging = !beSilent;
		} );
	}

	require( level ) {
		if( typeof level === "undefined" ) {
			level = LogLevels.DEBUG;
		}

		this.minLevel = level;
		this.__loggers.forEach( logger => {
			logger.__minLevel = level;
		} );
	}

	to( stream ) {
		this.__defaultStream = stream;
	}
}

module.exports = new LogFactory();
