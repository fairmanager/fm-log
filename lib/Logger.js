// jscs:disable requireNamedUnassignedFunctions
"use strict";

const chalk            = require( "chalk" );
const LogLevels        = require( "./LogLevels" );
const MessageFormatter = require( "./MessageFormatter" );
const Untraceable      = require( "./Untraceable" );
const util             = require( "util" );

class Logger {
	constructor( prefix, stream ) {
		/**
		 * A function that determines which stream we will log to.
		 * @type {Function}
		 * @private
		 */
		this.__targetSelector = Logger.targetSelector;

		/**
		 * Should this logger log anything?
		 * @type {boolean}
		 * @private
		 */
		this.__enabled = true;

		/**
		 * What level should a message at least have, so that this logger logs it?
		 */
		this.__minLevel = LogLevels.DEBUG;

		this.prefix = prefix;

		if( stream ) {
			this.to( stream );
		}
	}

	/**
	 * Enforces all logging to the given stream.
	 * @param {Stream} stream
	 * @returns {Logger}
	 */
	to( stream ) {
		this.__targetSelector = level => stream;
		return this;
	}

	static targetSelector( level ) {
		if( level >= LogLevels.ERROR ) {
			return process.stderr;
		}

		return process.stdout;
	}

	on() {
		this.__enabled = true;
		return this;
	}

	off() {
		this.__enabled = false;
		return this;
	}

	get enableLogging() {
		return this.__enabled;
	}

	set enableLogging( value ) {
		return this.__enabled = value;
	}

	sync( sync ) {
		this.sync = ( typeof sync === "undefined" ) ? true : sync;
		return this;
	}

	withSource( enable ) {
		this.traceLoggingCalls = !enable;
		return this;
	}

	require( level ) {
		this.__minLevel = level;
		return this;
	}

	/**
	 * Create and wrap a morgan instance.
	 * @param {String} format The format string to pass to morgan.
	 * @param {Object} [options] The options object that will be passed to the morgan constructor.
	 * @param {Function} [how] How to log the output provided by morgan. Usually something like log.info.bind( log )
	 * @returns {Function} The middleware that can be placed in the express pipeline. Also has a "morgan" member, referencing the actual morgan instance.
	 */
	morgan( format, options, how ) {
		how             = how || this.debug.bind( this );
		options         = options || {};
		const Stream    = require( "stream" ).Writable;
		const logStream = new Stream();
		logStream.write = data => {
			// Remove trailing newline
			data = data.slice( 0, data.length - 1 );
			how( data );
		};
		options.stream  = logStream;
		const morgan    = require( "morgan" )( format, options );
		// Morgan, morgan, morgan, morgan
		morgan.morgan   = morgan;
		return ( req, res, next ) => morgan( req, res, next );
	}

	debug( message ) {
		if( !this.__enabled || LogLevels.DEBUG < this.__minLevel ) {
			return;
		}
		message = MessageFormatter.format.apply( this, arguments );
		this.preLog( LogLevels.DEBUG, chalk.grey, this.debug, message );
	}

	info( message ) {
		if( !this.__enabled || LogLevels.INFO < this.__minLevel ) {
			return;
		}
		message = MessageFormatter.format.apply( this, arguments );
		this.preLog( LogLevels.INFO, chalk.cyan, this.info, message );
	}

	notice( message ) {
		if( !this.__enabled || LogLevels.NOTICE < this.__minLevel ) {
			return;
		}
		message = MessageFormatter.format.apply( this, arguments );
		this.preLog( LogLevels.NOTICE, chalk.green, this.debug, message );
	}

	warn( message ) {
		if( !this.__enabled || LogLevels.WARN < this.__minLevel ) {
			return;
		}
		message = MessageFormatter.format.apply( this, arguments );
		this.preLog( LogLevels.WARN, chalk.yellow, this.debug, message );
	}

	error( message ) {
		if( !this.__enabled || LogLevels.ERROR < this.__minLevel ) {
			return;
		}
		message = MessageFormatter.format.apply( this, arguments );
		this.preLog( LogLevels.ERROR, chalk.red, this.debug, message );
	}

	critical( message ) {
		if( !this.__enabled || LogLevels.CRITICAL < this.__minLevel ) {
			return;
		}
		message = MessageFormatter.format.apply( this, arguments );
		this.preLog( LogLevels.CRITICAL, str => {
			return chalk.bold( chalk.red( str ) );
		}, this.debug, message );
	}

	/**
	 * Pre-processes a logging subject. Like breaking it into further subjects or grabbing stacks from Errors.
	 * @param {Number} level The log level indicator.
	 * @param {Function} colorizer A function to be used to colorize the output.
	 * @param {Function} more A callback to use when further output needs to be logged.
	 * @param {String|Error} message The subject that should be logged.
	 */
	preLog( level, colorizer, more, message ) {
		if( !Logger.shouldLog( level, this, message ) ) {
			return;
		}
		Logger.lastLogger = more;

		// If we're supposed to trace the call sites, grab the location here.
		let location;
		if( this.traceLoggingCalls && !( message instanceof Untraceable ) ) {
			const stack = new Error().stack;
			// Wrap it into an untraceable, to make sure that logging it won't cause another trace.
			location    = new Untraceable( `  ${Logger.analyzeStack( stack )}` );
		}

		// If the supplied subject is an Error instance, grab the call stack and log that instead.
		if( util.isError( message ) ) {
			/** @type {Error} */
			const error = message;
			// Wrap the stack into an untraceable, to avoid that this more() call causes another trace down the line.
			more.call( this, new Untraceable( error.stack || error.message || "<invalid error>" ) );
			if( location ) {
				more( location );
			}
			return;
		}

		if( message instanceof Untraceable ) {
			message = message.toString();
		}

		if( message === void 0 ) {
			message = "undefined";
		}
		if( message === null ) {
			message = "null";
		}

		// Break up the logging subject into multiple lines as appropriate.
		const toLog = MessageFormatter.generateLogStack( level, this.prefix, message, colorizer );
		this.log( toLog, this.__targetSelector( level ), this.sync );
		if( location ) {
			more.call( this, location );
		}
	}

	/**
	 * Determines if a given message should be logged. The purpose is to avoid logging the same message continuously.
	 * @param {Number} level
	 * @param {Logger} logger
	 * @param {String} message The message being logged.
	 * @returns {boolean} true if the message should be logged; false otherwise.
	 */
	static shouldLog( level, logger, message ) {
		if( Logger.lastMessage && message === Logger.lastMessage.message && level === Logger.lastMessage.level && logger === Logger.lastMessage.logger ) {
			Logger.lastMessageRepeated = Logger.lastMessageRepeated || 0;
			++Logger.lastMessageRepeated;
			return false;

		} else if( Logger.lastMessage && 0 < Logger.lastMessageRepeated ) {
			delete Logger.lastMessage;
			Logger.lastLogger.call( logger,
				new Untraceable( `Last message repeated ${Logger.lastMessageRepeated}${( Logger.lastMessageRepeated === 1 ? " time." : " times." )}` ) );
			delete Logger.lastMessageRepeated;
		}

		Logger.lastMessage = {
			level   : level,
			logger  : logger,
			message : message
		};

		return true;
	}


	/**
	 * Take a stack trace and extract a location identifier from it.
	 * The location identifier represents the location from where the logger was invoked.
	 * @param {String} stack The traced stack
	 * @param {Number} [stackIndex=2] The element of the stack you want analyzed.
	 * @returns {String} A location identifier for the location from where the logger was invoked.
	 */
	static analyzeStack( stack, stackIndex ) {
		stackIndex = stackIndex || 2;

		/**
		 * Group 1: Function name (optional)
		 * Group 2: File name
		 * Group 3: Line
		 * Group 4: Column
		 */
		var callSitePattern = /at (?:(.*?) )?\(?(.*):(\d+):(\d+)\)?/g;
		var sites           = stack.match( callSitePattern );

		// The method that invoked the logger is located at index 2 of the stack
		if( sites && stackIndex <= sites.length ) {
			var callSiteElementPattern = /at (?:(.*?) )?\(?(.*):(\d+):(\d+)\)?/;
			// Pick apart
			var callSiteElements       = sites[ stackIndex ].match( callSiteElementPattern );
			var functionName           = "";
			var fileName               = "";
			var line                   = -1;
			var column                 = -1;
			// Assume either 4 (no function name) or 5 elements.
			if( callSiteElements.length === 5 ) {
				functionName = callSiteElements[ 1 ];
				fileName     = callSiteElements[ 2 ];
				line         = callSiteElements[ 3 ];
				column       = callSiteElements[ 4 ];
			} else {
				functionName = "(unnamed)";
				fileName     = callSiteElements[ 1 ];
				line         = callSiteElements[ 2 ];
				column       = callSiteElements[ 3 ];
			}

			return functionName + "@" + fileName + ":" + line + ":" + column;
		}
		return null;
	}

	log( message, stream, sync ) {
		const time      = new Date();
		const timestamp = MessageFormatter.formatDate( time );
		const logger    = sync ? stream.write : data => process.nextTick( () => stream.write( data ) );
		if( Array.isArray( message ) ) {
			const toLog = [];
			for( let messageIndex = 0, messageCount = message.length; messageIndex < messageCount; ++messageIndex ) {
				toLog.push( `${timestamp} ${message[ messageIndex ]}\n` );
			}

			logger.call( stream, toLog.join( "" ) );

		} else {
			logger.call( stream, `${timestamp} ${message}\n` );
		}
	}
}

module.exports = Logger;
