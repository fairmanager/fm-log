"use strict";

var colors = require( "colors" );
var util = require( "util" );

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
 * An object that will not have its source traced when it's logged.
 * @param {String} message The message to log
 * @constructor
 */
function Untraceable( message ) {
  this.message = message;
}
Untraceable.prototype.toString = function() {
  return this.message;
}

/**
 * Determines if a given message should be logged. The purpose is to avoid logging the same message continously.
 * @param {String} message The message being logged.
 * @returns {boolean} true if the message should be logged; false otherwise.
 */
var shouldLog = function( level, logger, message ) {
  if( lastMessage&&  message == lastMessage.message && level == lastMessage.level && logger == lastMessage.logger ) {
    ++lastMessageRepeated;
    return false;

  } else if( lastMessage && 0 < lastMessageRepeated ) {
    lastMessage = undefined;
    lastLogger( new Untraceable( "Last message repeated " + lastMessageRepeated + " times." ) );
    lastMessageRepeated = 0;

  } else {
    lastMessage = {level : level, logger : logger, message : message};
  }
  return true;
};

/**
 * The main logger class.
 */
var Logger = (function() {
  /**
   * Construct a new Logger instance.
   * @param {String} [prefix] An optional prefix to put in front of every
   * logged message. Usually this is the name of the module where the
   * logger is created. By default, prefixes are padded so that all logged
   * messages line up.
   * @constructor
   */
  function Logger( prefix ) {
    this.prefix = prefix;
  }

  /**
   * Pad a given prefix to the largest given length of all prefixes.
   * @param {String} prefix The prefix to pad.
   * @returns {string} The padded prefix.
   */
  var constructPrefix = function( prefix, multiline ) {
    // If there is no prefix and nothing else has a prefix, then the .module construction scheme is never used.
    // In this case, don't pad anything.
    if( !prefix && !moduleMaxLength ) return "";

    // If we have a prefix, pad it to the max prefix length, otherwise, leave off the parenthesis and just use spaces.
    return (prefix && !multiline) ? "(" + pad( prefix, moduleMaxLength, " " ) + ")" : pad( "", moduleMaxLength + 2, " " );
  };

  /**
   * Prefix a message with supplied prefix.
   * @param {String} prefix The prefix to place in front of the message.
   * @param {String} message The message that should be prefixed.
   * @returns {string} The properly prefixed message.
   */
  var prefixMessage = function( prefix, message, multiline ) {
    // Pad the prefix so that all logged messages line up
    prefix = constructPrefix( prefix, multiline );
    return (prefix) ? (prefix + " " + message ) : message;
  };

  /**
   * Pad a given string with another string(usually a single character), to a certain length.
   * @param {String|Number} padWhat The string that should be padded.
   * @param {Number} [length=2] How long the resulting string should be.
   * @param {String} [padWith="0"] What character should be used for the padding.
   * @returns {string} The properly padded string.
   */
  var pad = function( padWhat, length, padWith ) {
    length = length || 2;
    padWith = padWith || "0";
    var padding = length - ("" + padWhat).length;
    return padding ? (new Array( padding + 1 ).join( padWith ) + padWhat) : padWhat;
  };

  /**
   * Log a debug message.
   * @param {String} message The message to log.
   */
  Logger.prototype.debug = function( message ) {
    preLog( "[DEBUG ]", this, colors.grey, this.debug.bind( this ), message );
  };
  /**
   * Log an informational message.
   * @param {String} message The message to log.
   */
  Logger.prototype.info = function( message ) {
    preLog( "[INFO  ]", this, colors.cyan, this.info.bind( this ), message );
  };
  /**
   * Log a notice.
   * @param {String} message The message to log.
   */
  Logger.prototype.notice = function( message ) {
    preLog( "[NOTICE]", this, colors.green, this.notice.bind( this ), message );
  };
  /**
   * Log a warning.
   * @param {String} message The message to log.
   */
  Logger.prototype.warn = function( message ) {
    preLog( "[WARN  ]", this, colors.yellow, this.warn.bind( this ), message );
  };
  /**
   * Log an error.
   * @param {String} message The message to log.
   */
  Logger.prototype.error = function( message ) {
    preLog( "[ERROR ]", this, colors.red, this.error.bind( this ), message );
  };
  /**
   * Log a critical event.
   * @param {String} message The message to log.
   */
  Logger.prototype.critical = function( message ) {
    preLog( "[CRITIC]", this, function( str ) {return colors.bold( colors.red( str ) ); }, this.critical.bind( this ), message );
  };

  // Aliases
  Logger.prototype.verbose = Logger.prototype.debug;
  Logger.prototype.err = Logger.prototype.error;
  Logger.prototype.crit = Logger.prototype.critical;

  /**
   * Pre-processes a logging subject. Like breaking it into further subjects or grabbing stacks from Errors.
   * @param {String} level The log level indicator.
   * @param {Logger} logger The logger that called this function.
   * @param {Function} colorizer A function to be used to colorize the output.
   * @param {Function} more A callback to use when further output needs to be logged.
   * @param {String} message The subject that should be logged.
   */
  var preLog = function( level, logger, colorizer, more, message ) {
    if( !shouldLog( level, logger, message ) ) {
      return;
    }
    lastLogger = more;

    // If the supplied subject is an Error instance, grab the call stack and log that instead.
    if( util.isError( message ) ) {
      /** @type {Error} */
      var error = message;
      more( error.stack );
      return;
    }

    // Break up the logging subject into multiple lines as appropriate.
    var toLog = generateLogStack( level, logger, message, colorizer );
    log( toLog );
  };

  var analyzeStack = function( stack ) {
    /**
     * Group 1: Function name (optional)
     * Group 2: File name
     * Group 3: Line
     * Group 4: Column
     */
    var callSitePattern = new RegExp( /at (?:(.*) )?\(?(.*):(\d+):(\d+)\)?/g );
    var sites = stack.match( callSitePattern );

    // The method that invoked the logger is located at index 3 of the stack
    if( sites && 3 <= sites.length ) {
      var callSiteElementPattern = new RegExp( /at (?:(.*) )?\(?(.*):(\d+):(\d+)\)?/ );
      // Pick apart
      var callSiteElements = sites[ 3 ].match( callSiteElementPattern );
      var functionName, fileName, line, column;
      // Assume either 4 (no function name) or 5 elements.
      if( callSiteElements.length == 5 ) {
        functionName = callSiteElements[ 1 ];
        fileName = callSiteElements[ 2 ];
        line = callSiteElements[ 3 ];
        column = callSiteElements[ 4 ];
      } else {
        functionName = "(unnamed)";
        fileName = callSiteElements[ 1 ];
        line = callSiteElements[ 2 ];
        column = callSiteElements[ 3 ];
      }

      return functionName + "@" + fileName + ":" + line + ":" + column;
    }
    return null;
  };

  /**
   * For a given input, generates a stack of lines that should be logged.
   * @param {String} level The log level indicator.
   * @param {Logger} logger The logger that invoked this function.
   * @param {String} subject The subject that should be logged.
   * @param {Function} colorizer A function to be used to colorize the output.
   * @returns {Array|String} Either a single string to log, or an array of strings to log.
   */
  var generateLogStack = function( level, logger, subject, colorizer ) {
    var lines = subject.toString().split( "\n" );

    // If we're supposed to trace the call sites, grab the location here.
    if( logger.traceLoggingCalls && !( subject instanceof Untraceable ) ) {
      var stack = new Error().stack;
      var location = analyzeStack( stack );
      lines.push( "  " + location );
    }

    // Most common case, a single line.
    if( lines.count == 1 ) {
      return colorizer( level + " " + prefixMessage( logger.prefix, subject ) );
    }
    // Multiple lines, prepare them all nice like.
    for( var lineIndex = 0, lineCount = lines.length; lineIndex < lineCount; ++lineIndex ) {
      lines[lineIndex] = colorizer( level + " " + prefixMessage( logger.prefix, lines[ lineIndex ], lineIndex > 0 ) );
      // Replace the level prefix with whitespace for lines other than the first
      if( 0 == lineIndex ) {
        level = pad( "", level.length, " " );
      }
    }
    return 1 < lines.length ? lines : lines[ 0 ];
  };

  /**
   * Log a message.
   * @param {String} message The message to log.
   */
  var log = function( message ) {
    var time = new Date();
    var timestamp = formatDate( time );
    if( util.isArray( message ) ) {
      for( var messageIndex = 0, messageCount = message.length; messageIndex < messageCount; ++messageIndex ) {
        console.log( timestamp + " " + message[ messageIndex ] );
      }
    } else {
      console.log( timestamp + " " + message );
    }
  };

  /**
   * Format the given date to our desired log timestamp format.
   * @param {Date} date The date that should be formatted.
   * @returns {string} A string in the format of YYYY-MM-DD HH:mm:SS.sss
   */
  var formatDate = function( date ) {
    return date.getFullYear() + "-" + pad( date.getMonth() + 1 ) + "-" + pad( date.getDate() ) + " " +
           pad( date.getHours() ) + ":" + pad( date.getMinutes() ) + ":" + pad( date.getSeconds() ) + "." + pad( date.getMilliseconds(), 3 );
  };

  /**
   * Enable or disable debug output.
   * @param {Boolean} [enable=true] Should debug output be enabled?
   */
  Logger.prototype.withSource = function( enable ) {
    this.traceLoggingCalls = !!!enable;
    return this;
  }

  /**
   * Construct a new Logger instance for a module with the given name.
   * @param {String} [moduleName] The name of the module.
   * @returns {Logger} The Logger for the module.
   */
  Logger.fromModule = function( moduleName ) {
    if( !moduleName ) {
      var error = new Error().stack;
      var matches = error.match( /at Object.<anonymous> .*[\\/](.*?):/ );
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
}());

module.exports = new Logger();
module.exports.module = Logger.fromModule;