"use strict";

var colors = require( "colors" );

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
 * @type {String}
 */
var lastMessage;

/**
 * How often was the last message repeated.
 * @type {number}
 */
var lastMessageRepeated = 0;

/**
 * Determines if a given message should be logged. The purpose is to avoid logging the same message continously.
 * @param {String} message The message being logged.
 * @returns {boolean} true if the message should be logged; false otherwise.
 */
var shouldLog = function( message ) {
  if( message == lastMessage ) {
    ++lastMessageRepeated;
    return false;

  } else if( lastMessage && 0 < lastMessageRepeated ) {
    lastMessage = undefined;
    lastLogger( "Last message repeated " + lastMessageRepeated + " times." );
    lastMessageRepeated = 0;

  } else {
    lastMessage = message;
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
  var constructPrefix = function( prefix ) {
    // If there is no prefix and nothing else has a prefix, then the .module construction scheme is never used.
    // In this case, don't pad anything.
    if( !prefix && !moduleMaxLength ) return "";

    // If we have a prefix, pad it to the max prefix length, otherwise, leave off the parenthesis and just use spaces.
    return (prefix) ? "(" + pad( prefix, moduleMaxLength, " " ) + ")" : pad( "", moduleMaxLength + 2, " " );
  };

  /**
   * Prefix a message with supplied prefix.
   * @param {String} prefix The prefix to place in front of the message.
   * @param {String} message The message that should be prefixed.
   * @returns {string} The properly prefixed message.
   */
  var prefixMessage = function( prefix, message ) {
    // Pad the prefix so that all logged messages line up
    prefix = constructPrefix( prefix );
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
    var toLog = "[DEBUG ] " + prefixMessage( this.prefix, message );
    this.log( toLog.grey, this.debug.bind( this ) );
  };
  /**
   * Log an informational message.
   * @param {String} message The message to log.
   */
  Logger.prototype.info = function( message ) {
    var toLog = "[INFO  ] " + prefixMessage( this.prefix, message );
    this.log( toLog.cyan, this.info.bind( this ) );
  };
  /**
   * Log a notice.
   * @param {String} message The message to log.
   */
  Logger.prototype.notice = function( message ) {
    var toLog = "[NOTICE] " + prefixMessage( this.prefix, message );
    this.log( toLog.green, this.notice.bind( this ) );
  };
  /**
   * Log a warning.
   * @param {String} message The message to log.
   */
  Logger.prototype.warn = function( message ) {
    var toLog = "[WARN  ] " + prefixMessage( this.prefix, message );
    this.log( toLog.yellow, this.warn.bind( this ) );
  };
  /**
   * Log an error.
   * @param {String} message The message to log.
   */
  Logger.prototype.error = function( message ) {
    var toLog = "[ERROR ] " + prefixMessage( this.prefix, message );
    this.log( toLog.red, this.error.bind( this ) );
  };
  /**
   * Log a critical event.
   * @param {String} message The message to log.
   */
  Logger.prototype.critical = function( message ) {
    var toLog = "[CRITIC] " + prefixMessage( this.prefix, message );
    this.log( toLog.red.bold, this.critical.bind( this ) );
  };
  // Aliases
  Logger.prototype.verbose = Logger.prototype.debug;
  Logger.prototype.err = Logger.prototype.error;
  Logger.prototype.crit = Logger.prototype.critical;

  /**
   * Log a message.
   * @param {String} message The message to log.
   */
  Logger.prototype.log = function( message, more ) {
    if( !shouldLog( message ) ) {
      return;
    }
    lastLogger = more;
    var time = new Date();
    var timestamp = this.formatDate( time );
    console.log( timestamp + " " + message );
  };

  /**
   * Format the given date to our desired log timestamp format.
   * @param {Date} date The date that should be formatted.
   * @returns {string} A string in the format of YYYY-MM-DD HH:mm:SS.sss
   */
  Logger.prototype.formatDate = function( date ) {
    return date.getFullYear() + "-" + pad( date.getMonth() + 1 ) + "-" + pad( date.getDate() ) + " " +
           pad( date.getHours() ) + ":" + pad( date.getMinutes() ) + ":" + pad( date.getSeconds() ) + "." + pad( date.getMilliseconds(), 3 );
  };

  /**
   * Construct a new Logger instance for a module with the given name.
   * @param {String} [moduleName] The name of the module.
   * @returns {Logger} The Logger for the module.
   */
  Logger.fromModule = function( moduleName ) {
    if( moduleName ) {
      moduleMaxLength = Math.max( moduleMaxLength, moduleName.length );
    }
    return new Logger( moduleName );
  };
  return Logger;
}());

module.exports = new Logger();
module.exports.module = Logger.fromModule;