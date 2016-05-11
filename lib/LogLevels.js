"use strict";

module.exports = {
	DEBUG    : -1,
	INFO     : 0,
	NOTICE   : 1,
	WARN     : 2,
	ERROR    : 3,
	CRITICAL : 10
};

module.exports.render = level => {
	return [ "DEBUG", "INFO", "NOTICE", "WARN", "ERROR", "", "", "", "", "", "", "CRITIC" ][ level + 1 ];
};
