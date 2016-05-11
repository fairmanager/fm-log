"use strict";

class Untraceable {
	constructor( message ) {
		this.message = message;
	}

	toString() {
		return this.message;
	}
}

module.exports = Untraceable;
