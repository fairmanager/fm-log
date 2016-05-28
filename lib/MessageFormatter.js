"use strict";

const http      = require( "http" );
const LogLevels = require( "./LogLevels" );
const util      = require( "util" );

class MessageFormatter {
	/**
	 * Apply util.format on the supplied arguments, as applicable.
	 * @returns {String} The formatted string.
	 */
	static formatString() {
		return ( 1 < arguments.length ) ? util.format.apply( util, arguments ) : arguments[ 0 ];
	}

	/**
	 * If the supplied message is an express request, a new message will be generated which only contains relevant properties.
	 * @param {*} message
	 * @returns {*}
	 */
	static unrollRequest( message ) {
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

	static format( message ) {
		message = ( typeof message === "string" || message instanceof String ) ? MessageFormatter.formatString.apply(
			this,
			arguments ) : message;
		message = MessageFormatter.unrollRequest( message );

		return message;
	}

	/**
	 * For a given input, generates a stack of lines that should be logged.
	 * @param {Number} level The log level indicator.
	 * @param {String} prefix The prefix for logged messages.
	 * @param {String} subject The subject that should be logged.
	 * @param {Function} colorizer A function to be used to colorize the output.
	 * @returns {Array|String} Either a single string to log, or an array of strings to log.
	 */
	static generateLogStack( level, prefix, subject, colorizer ) {
		const subjectString = ( util.isArray( subject ) || typeof subject === "object" ) ? MessageFormatter.stringify( subject ) : subject.toString();
		const lines         = subjectString.split( "\n" );
		let levelString     = LogLevels.render( level );
		levelString         = `[${MessageFormatter.pad( levelString, 6, " ", true )}]`;

		// Most common case, a single line.
		if( lines.length === 1 ) {
			return colorizer( `${levelString} ${MessageFormatter.prefixMessage( prefix, subject )}` );
		}
		// Multiple lines, prepare them all nice like.
		for( var lineIndex = 0, lineCount = lines.length; lineIndex < lineCount; ++lineIndex ) {
			lines[ lineIndex ] = colorizer( levelString + " " + MessageFormatter.prefixMessage( prefix,
					lines[ lineIndex ],
					lineIndex > 0 ) );
			// Replace the level prefix with whitespace for lines other than the first
			if( 0 === lineIndex ) {
				levelString = MessageFormatter.pad( "", levelString.length, " " );
			}
		}
		return 1 < lines.length ? lines : lines[ 0 ];
	}

	/**
	 * Convert an object to a JSON formatted string.
	 * @param {*} subject The object that should be serialized to JSON.
	 * @returns {*}
	 */
	static stringify( subject ) {
		const cache = [];
		const json  = JSON.stringify( subject, function serializeKv( key, value ) {
			if( value === undefined ) {
				return "undefined";
			}
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
	 * Prefix a message with supplied prefix.
	 * @param {String} prefix The prefix to place in front of the message.
	 * @param {String} message The message that should be prefixed.
	 * @param {Boolean} [multiline] Are we constructing the prefix for the second or later line in a multiline construct?
	 * @returns {string} The properly prefixed message.
	 */
	static prefixMessage( prefix, message, multiline ) {
		// Pad the prefix so that all logged messages line up
		prefix = MessageFormatter.constructPrefix( prefix, multiline );
		return prefix ? ( prefix + " " + message ) : message;
	}

	/**
	 * Pad a given prefix to the largest given length of all prefixes.
	 * @param {String} prefix The prefix to pad.
	 * @param {Boolean} [multiline] Are we constructing the prefix for the second or later line in a multiline construct?
	 * @returns {string} The padded prefix.
	 */
	static constructPrefix( prefix, multiline ) {
		const Logger = require( "./Logger" );

		// If there is no prefix and nothing else has a prefix, then the .module construction scheme is never used.
		// In this case, don't pad anything.
		if( !prefix && !Logger.moduleMaxLength ) {
			return "";
		}

		// If we have a prefix, pad it to the max prefix length, otherwise, leave off the parenthesis and just use spaces.
		return ( prefix && !multiline ) ?
		       `(${MessageFormatter.pad( prefix, Logger.moduleMaxLength, " " )})` :
		       MessageFormatter.pad( "", Logger.moduleMaxLength + 2, " " );
	}

	/**
	 * Pad a given string with another string(usually a single character), to a certain length.
	 * @param {String|Number} padWhat The string that should be padded.
	 * @param {Number} [length=2] How long the resulting string should be.
	 * @param {String} [padWith="0"] What character should be used for the padding.
	 * @param {Boolean} [right=false] Should the padding be applied on the right side of the string?
	 * @returns {string} The properly padded string.
	 */
	static pad( padWhat, length, padWith, right ) {
		length        = length || 2;
		padWith       = padWith || "0";
		const padding = length - ( "" + padWhat ).length;
		if( right ) {
			return padding ? ( padWhat + new Array( padding + 1 ).join( padWith ) ) : padWhat;
		} else {
			return padding ? ( new Array( padding + 1 ).join( padWith ) + padWhat ) : padWhat;
		}
	}

	/**
	 * Format the given date to our desired log timestamp format.
	 * @param {Date} date The date that should be formatted.
	 * @returns {string} A string in the format of YYYY-MM-DD HH:mm:SS.sss
	 */
	static formatDate( date ) {
		const p = MessageFormatter.pad;
		return `${date.getFullYear()}-${p( date.getMonth() + 1 )}-${p( date.getDate() )} ${p( date.getHours() )}:${p(
			date.getMinutes() )}:${p( date.getSeconds() )}.${p( date.getMilliseconds(), 3 )}`;
	}

}

module.exports = MessageFormatter;
