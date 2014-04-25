fm-log
======

What?
-----
Straight-forward logging module.

- lines up everything in nice columns
- uses colors
- sends everything straight to `console.log`, no events, no `nextTick()`
- condenses repeated messages like:

        2014-04-24 17:17:00.138 [DEBUG ] (    api-mobile.js) Cleaning up messages...
        2014-04-24 17:34:32.715 [DEBUG ] (    api-mobile.js) Last message repeated 17 times.
        2014-04-24 17:34:32.715 [INFO  ] (    api-person.js) API-REQUEST: List Person...

- displays stack traces for logged Error instances and other multi-line content like:

	![](img/example2.png) 

Example
-------

	var log = require( "fm-log" ).module( path.basename( __filename ) );
	log.info( "Initializing application..." );
	  
	log.debug( "We be logging" );
	log.info( "We be logging" );
	log.notice( "We be logging" );
	log.warn( "We be warning" );
	log.error( "We be logging" );
	log.critical( "We be logging" );
	
	var generic = require( "fm-log" );
	generic.notice( "We don't need no prefix" );

![](img/example.png)

How?
----

Put this in every file where you want to log:

    var log = require( "fm-log" ).module( path.basename( __filename ) );

Then just use `log.info` or one of the other logging levels shown above.

For loggers without a specific prefix, just `require()` the module and use it directly:

	var generic = require( "fm-log" );
	generic.notice( "We don't need no prefix" );