var CompoundDuplex = require('./compound-duplex');
var PassThrough = require('../passthrough');
var ThroughStream = require('./through-stream');
var inherits = require('util').inherits;

/**
 * This stream exists for the sole purpose of wrapping the commonly used npm module
 * 'request' to make it act like a real duplex stream.  The "stream" it returns is
 * not a real streams2 stream, and does not work with the zstreams conversion methods.
 *
 * @class RequestStream
 * @constructor
 * @param {Request} requestStream - The "stream" returned from request()
 */
function RequestStream(requestStream) {
	var self = this;
	var inputPassThrough = new PassThrough();
	var outputPassThrough = new PassThrough();
	if(requestStream.method !== 'GET') {
		inputPassThrough.pipe(requestStream, { noConvert: true });
	}
	
	//console.log('Piping requeststream to outputpassthrough');
	//requestStream.pipe(require('fs').createWriteStream('/tmp/requesttest'));
	requestStream.pipe(outputPassThrough);
	CompoundDuplex.call(this, inputPassThrough, outputPassThrough);
}
inherits(RequestStream, CompoundDuplex);

module.exports = RequestStream;
