"use strict";

var chalk = require( "chalk" );
var http  = require( "http" );
var util  = require( "util" );

/**
 * Keep track of the longest supplied module names for padding.
 * @type {number}
 */
var moduleMaxLength = 0;

/**
 * The last logging function that was used.
 * @type {Function}
 */
var lastLogger;

/**
 * The last message that was logged.
 * @type {Object}
 */
var lastMessage;

/**
 * How often was the last message repeated.
 * @type {number}
 */
var lastMessageRepeated = 0;

/**
 * The stream to write log messages to.
 * @type {process.stdout|Stream}
 */
var globalStream = process.stdout;

/**
 * An object that will not have its source traced when it's logged.
 * @param {String} message The message to log
 * @constructor
 */
function Untraceable( message ) {
	this.message = message;
}
Untraceable.prototype.toString = function Untraceable$toString() {
	return this.message;
};

/**
 * Determines if a given message should be logged. The purpose is to avoid logging the same message continously.
 * @param {String} level
 * @param {Logger} logger
 * @param {String} message The message being logged.
 * @returns {boolean} true if the message should be logged; false otherwise.
 */
function shouldLog( level, logger, message ) {
	if( lastMessage && message == lastMessage.message && level == lastMessage.level && logger == lastMessage.logger ) {
		++lastMessageRepeated;
		return false;

	} else if( lastMessage && 0 < lastMessageRepeated ) {
		lastMessage         = undefined;
		lastLogger( new Untraceable( "Last message repeated " + lastMessageRepeated + ( ( lastMessageRepeated === 1 ) ? " time." : " times.") ) );
		lastMessageRepeated = 0;

	} else {
		lastMessage = {
			level   : level,
			logger  : logger,
			message : message
		};
	}
	return true;
}

/**
 * The main logger class.
 */
var Logger = ( function iife() {
	/**
	 * Construct a new Logger instance.
	 * @param {String} [prefix] An optional prefix to put in front of every
	 * logged message. Usually this is the name of the module where the
	 * logger is created. By default, prefixes are padded so that all logged
	 * messages line up.
	 * @param {Stream} [stream] The stream to log to.
	 * @constructor
	 */
	function Logger( prefix, stream ) {
		this.prefix = prefix;
		this.stream = stream || globalStream;
	}

	/**
	 * Pad a given prefix to the largest given length of all prefixes.
	 * @param {String} prefix The prefix to pad.
	 * @param {Boolean} [multiline] Are we constructing the prefix for the second or later line in a multiline construct?
	 * @returns {string} The padded prefix.
	 */
	function constructPrefix( prefix, multiline ) {
		// If there is no prefix and nothing else has a prefix, then the .module construction scheme is never used.
		// In this case, don't pad anything.
		if( !prefix && !moduleMaxLength ) {
			return "";
		}

		// If we have a prefix, pad it to the max prefix length, otherwise, leave off the parenthesis and just use spaces.
		return ( prefix && !multiline ) ? "(" + pad( prefix, moduleMaxLength, " " ) + ")" : pad( "",
			moduleMaxLength + 2,
			" " );
	}

	/**
	 * Prefix a message with supplied prefix.
	 * @param {String} prefix The prefix to place in front of the message.
	 * @param {String} message The message that should be prefixed.
	 * @param {Boolean} [multiline] Are we constructing the prefix for the second or later line in a multiline construct?
	 * @returns {string} The properly prefixed message.
	 */
	function prefixMessage( prefix, message, multiline ) {
		// Pad the prefix so that all logged messages line up
		prefix = constructPrefix( prefix, multiline );
		return prefix ? ( prefix + " " + message ) : message;
	}

	/**
	 * Pad a given string with another string(usually a single character), to a certain length.
	 * @param {String|Number} padWhat The string that should be padded.
	 * @param {Number} [length=2] How long the resulting string should be.
	 * @param {String} [padWith="0"] What character should be used for the padding.
	 * @returns {string} The properly padded string.
	 */
	function pad( padWhat, length, padWith ) {
		length      = length || 2;
		padWith     = padWith || "0";
		var padding = length - ( "" + padWhat ).length;
		return padding ? ( new Array( padding + 1 ).join( padWith ) + padWhat ) : padWhat;
	}

	/**
	 * If the supplied message is an express request, a new message will be generated which only contains relevant properties.
	 * @param {*} message
	 * @returns {*}
	 */
	function unrollRequest( message ) {
		if( message instanceof http.IncomingMessage && message.originalUrl ) {
			message = {
				httpVersion : message.httpVersion,
				headers     : message.headers,
				trailers    : message.trailers,
				method      : message.method,
				url         : message.url,
				statusCode  : message.statusCode,

				body          : message.body,
				params        : message.params,
				query         : message.query,
				cookies       : message.cookies,
				signedCookies : message.signedCookies,
				ip            : message.ip,
				ips           : message.ips,
				path          : message.path,
				host          : message.hostname || message.host,
				fresh         : message.fresh,
				stale         : message.stale,
				xhr           : message.xhr,
				protocol      : message.protocol,
				secure        : message.secure,
				subdomains    : message.subdomains,
				originalUrl   : message.originalUrl
			};
		}
		return message;
	}

	/**
	 * Log a debug message.
	 * @param {String|Error|IncomingMessage} message The message to log.
	 */
	Logger.prototype.debug = function Logger$debug( message ) {
		if( !module.exports.enableLogging ) {
			return;
		}
		message = ( typeof message == "string" || message instanceof String ) ? formatString.apply( this,
			arguments ) : message;
		message = unrollRequest( message );
		preLog( "[DEBUG ]", this, chalk.grey, this.debug.bind( this ), message );
	};

	/**
	 * Log an informational message.
	 * @param {String|Error|IncomingMessage} message The message to log.
	 */
	Logger.prototype.info = function Logger$info( message ) {
		if( !module.exports.enableLogging ) {
			return;
		}
		message = ( typeof message == "string" || message instanceof String ) ? formatString.apply( this,
			arguments ) : message;
		message = unrollRequest( message );
		preLog( "[INFO  ]", this, chalk.cyan, this.info.bind( this ), message );
	};

	/**
	 * Log a notice.
	 * @param {String|Error|IncomingMessage} message The message to log.
	 */
	Logger.prototype.notice = function Logger$notice( message ) {
		if( !module.exports.enableLogging ) {
			return;
		}
		message = ( typeof message == "string" || message instanceof String ) ? formatString.apply( this,
			arguments ) : message;
		message = unrollRequest( message );
		preLog( "[NOTICE]", this, chalk.green, this.notice.bind( this ), message );
	};

	/**
	 * Log a warning.
	 * @param {String|Error|IncomingMessage} message The message to log.
	 */
	Logger.prototype.warn = function Logger$warn( message ) {
		if( !module.exports.enableLogging ) {
			return;
		}
		message = ( typeof message == "string" || message instanceof String ) ? formatString.apply( this,
			arguments ) : message;
		message = unrollRequest( message );
		preLog( "[WARN  ]", this, chalk.yellow, this.warn.bind( this ), message );
	};

	/**
	 * Log an error.
	 * @param {String|Error|IncomingMessage} message The message to log.
	 */
	Logger.prototype.error = function Logger$error( message ) {
		if( !module.exports.enableLogging ) {
			return;
		}
		message = ( typeof message == "string" || message instanceof String ) ? formatString.apply( this,
			arguments ) : message;
		message = unrollRequest( message );
		preLog( "[ERROR ]", this, chalk.red, this.error.bind( this ), message );
	};

	/**
	 * Log a critical event.
	 * @param {String|Error|IncomingMessage} message The message to log.
	 */
	Logger.prototype.critical = function Logger$critical( message ) {
		if( !module.exports.enableLogging ) {
			return;
		}
		message = ( typeof message == "string" || message instanceof String ) ? formatString.apply( this,
			arguments ) : message;
		message = unrollRequest( message );
		preLog( "[CRITIC]", this, function colorize( str ) {
			return chalk.bold( chalk.red( str ) );
		}, this.critical.bind( this ), message );
	};

	// Aliases
	Logger.prototype.verbose = Logger.prototype.debug;
	Logger.prototype.err     = Logger.prototype.error;
	Logger.prototype.crit    = Logger.prototype.critical;

	/**
	 * Apply util.format on the supplied arguments, as applicable.
	 * @returns {String} The formatted string.
	 */
	function formatString() {
		return ( 1 < arguments.length ) ? util.format.apply( util, arguments ) : arguments[ 0 ];
	}

	/**
	 * Pre-processes a logging subject. Like breaking it into further subjects or grabbing stacks from Errors.
	 * @param {String} level The log level indicator.
	 * @param {Logger} logger The logger that called this function.
	 * @param {Function} colorizer A function to be used to colorize the output.
	 * @param {Function} more A callback to use when further output needs to be logged.
	 * @param {String|Error} message The subject that should be logged.
	 */
	function preLog( level, logger, colorizer, more, message ) {
		if( !shouldLog( level, logger, message ) ) {
			return;
		}
		lastLogger = more;

		// If we're supposed to trace the call sites, grab the location here.
		var location;
		if( logger.traceLoggingCalls && !( message instanceof Untraceable ) ) {
			var stack = new Error().stack;
			// Wrap it into an untraceable, to make sure that logging it won't cause another trace.
			location = new Untraceable( "  " + analyzeStack( stack ) );
		}

		// If the supplied subject is an Error instance, grab the call stack and log that instead.
		if( util.isError( message ) ) {
			/** @type {Error} */
			var error = message;
			// Wrap the stack into an untraceable, to avoid that this more() call causes another trace down the line.
			more( new Untraceable( error.stack || error.message || "<invalid error>" ) );
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
		var toLog = generateLogStack( level, logger, message, colorizer );
		log( toLog, logger.stream, logger.sync );
		if( location ) {
			more( location );
		}
	}

	/**
	 * Take a stack trace and extract a location identifier from it.
	 * The location identifier represents the location from where the logger was invoked.
	 * @param {String} stack The traced stack
	 * @param {Number} [stackIndex=2] The element of the stack you want analyzed.
	 * @returns {String} A location identifier for the location from where the logger was invoked.
	 */
	function analyzeStack( stack, stackIndex ) {
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
			var callSiteElements = sites[ stackIndex ].match( callSiteElementPattern );
			var functionName     = "";
			var fileName         = "";
			var line             = -1;
			var column           = -1;
			// Assume either 4 (no function name) or 5 elements.
			if( callSiteElements.length == 5 ) {
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

	/**
	 * Convert an object to a JSON formatted string.
	 * @param {*} subject The object that should be serialized to JSON.
	 * @returns {*}
	 */
	function stringify( subject ) {
		var cache = [];
		var json  = JSON.stringify( subject, function serializeKv( key, value ) {
			if( typeof value === "object" && value !== null ) {
				if( cache.indexOf( value ) !== -1 ) {
					// Circular reference found, discard key
					return;
				}
				// Store value in our collection
				cache.push( value );
			}
			return value;
		}, 2 );
		return json;
	}

	/**
	 * For a given input, generates a stack of lines that should be logged.
	 * @param {String} level The log level indicator.
	 * @param {Logger} logger The logger that invoked this function.
	 * @param {String} subject The subject that should be logged.
	 * @param {Function} colorizer A function to be used to colorize the output.
	 * @returns {Array|String} Either a single string to log, or an array of strings to log.
	 */
	function generateLogStack( level, logger, subject, colorizer ) {
		var subjectString = ( util.isArray( subject ) || typeof subject == "object" ) ? stringify( subject ) : subject.toString();
		var lines         = subjectString.split( "\n" );

		// Most common case, a single line.
		if( lines.length == 1 ) {
			return colorizer( level + " " + prefixMessage( logger.prefix, subject ) );
		}
		// Multiple lines, prepare them all nice like.
		for( var lineIndex = 0, lineCount = lines.length; lineIndex < lineCount; ++lineIndex ) {
			lines[ lineIndex ] = colorizer( level + " " + prefixMessage( logger.prefix,
					lines[ lineIndex ],
					lineIndex > 0 ) );
			// Replace the level prefix with whitespace for lines other than the first
			if( 0 === lineIndex ) {
				level = pad( "", level.length, " " );
			}
		}
		return 1 < lines.length ? lines : lines[ 0 ];
	}

	/**
	 * Log a message.
	 * @param {String} message The message to log.
	 * @param {Stream} stream Where to log to.
	 * @param {Boolean} sync Should be log synchronously?
	 */
	function log( message, stream, sync ) {
		var time      = new Date();
		var timestamp = formatDate( time );
		var logger    = sync ? stream.write : function delayedLog( data ) {
			process.nextTick( function write() {
				stream.write( data );
			} );
		};
		if( util.isArray( message ) ) {
			for( var messageIndex = 0, messageCount = message.length; messageIndex < messageCount; ++messageIndex ) {
				logger.call( stream, timestamp + " " + message[ messageIndex ] + "\n" );
			}
		} else {
			logger.call( stream, timestamp + " " + message + "\n" );
		}
	}

	/**
	 * Format the given date to our desired log timestamp format.
	 * @param {Date} date The date that should be formatted.
	 * @returns {string} A string in the format of YYYY-MM-DD HH:mm:SS.sss
	 */
	function formatDate( date ) {
		return date.getFullYear() + "-" + pad( date.getMonth() + 1 ) + "-" + pad( date.getDate() ) + " " +
		       pad( date.getHours() ) + ":" + pad( date.getMinutes() ) + ":" + pad( date.getSeconds() ) + "." + pad( date.getMilliseconds(),
				3 );
	}

	/**
	 * Enable or disable debug output.
	 * @param {Boolean} [enable=true] Should debug output be enabled?
	 */
	Logger.prototype.withSource = function Logger$withSource( enable ) {
		this.traceLoggingCalls = !enable;
		return this;
	};

	/**
	 * Create and wrap a morgan instance.
	 * @param {String} format The format string to pass to morgan.
	 * @param {Object} [options] The options object that will be passed to the morgan constructor.
	 * @param {Function} [how] How to log the output provided by morgan. Usually something like log.info.bind( log )
	 * @returns {Function} The middleware that can be placed in the express pipeline. Also has a "morgan" member, referencing the actual morgan instance.
	 */
	Logger.prototype.morgan = function Logger$morgan( format, options, how ) {
		how             = how || this.debug.bind( this );
		options         = options || {};
		var Stream      = require( "stream" ).Writable;
		var logStream   = new Stream();
		logStream.write = function writeHandler( data ) {
			// Remove trailing newline
			data = data.slice( 0, data.length - 1 );
			how( data );
		};
		options.stream  = logStream;
		var morgan      = require( "morgan" )( format, options );
		// Morgan, morgan, morgan, morgan
		morgan.morgan = morgan;
		return function middleware( req, res, next ) {
			morgan( req, res, next );
		};
	};

	/**
	 * Send log output to the given stream.
	 * @param {Stream} stream
	 * @returns {Logger} Returns itself
	 */
	Logger.prototype.to = function Logger$to( stream ) {
		this.stream = stream;
		return this;
	};

	/**
	 * Request synchronous logging.
	 * @param {Boolean} [sync=true] Should the logger log synchronously?
	 * @returns {Logger} Returns itself
	 */
	Logger.prototype.sync = function Logger$sync( sync ) {
		this.sync = ( typeof sync === "undefined" ) ? true : sync;
		return this;
	};

	/**
	 * Construct a new Logger instance for a module with the given name.
	 * @param {String} [moduleName] The name of the module.
	 * @returns {Logger} The Logger for the module.
	 */
	Logger.fromModule = function Logger$fromModule( moduleName ) {
		if( !moduleName ) {
			var error   = new Error().stack;
			var matches = error.match( /at (?:Context|Object).<anonymous> .*[\\/](.*?):/ );
			if( matches && matches.length >= 2 ) {
				moduleName = matches[ 1 ];
			}
		}
		if( moduleName ) {
			moduleMaxLength = Math.max( moduleMaxLength, moduleName.length );
		}
		return new Logger( moduleName );
	};

	return Logger;
}() );

function disable( levels ) {
	if( typeof levels === "string" ) {
		levels = [ levels ];
	}

	levels.forEach( function disableLevel( level ) {
		if( !level in Logger.prototype ) {
			throw new Error( "Invalid logger: " + level );
		}
		Logger.prototype[ level ] = Function.prototype;
	} );
}

module.exports               = new Logger();
module.exports.module        = Logger.fromModule;
module.exports.enableLogging = true;
module.exports.disable       = disable;
