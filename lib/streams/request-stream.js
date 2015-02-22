var CompoundDuplex = require('./compound-duplex');
var PassThrough = require('../passthrough');
var ThroughStream = require('./through-stream');
var inherits = require('util').inherits;

/**
 * This stream exists for the sole purpose of wrapping the commonly used npm module
 * 'request' to make it act like a real duplex stream.  The "stream" it returns is
 * not a real streams2 stream, and does not work with the zstreams conversion methods.
 *
 * This class will emit errors from the request stream and will also emit the 'response'
 * event proxied from the request stream.  Additionally, it will emit errors if a non-200
 * response code is received (see options.allowedStatusCodes) .
 *
 * @class RequestStream
 * @constructor
 * @param {Request} requestStream - The "stream" returned from request()
 * @param {Object} options - Options to change behavior of the stream
 * @param {String[]|Number[]} options.allowedStatusCodes - If a response is received
 * with a HTTP status code not in this list, it is considered an error.  This defaults
 * to [200] .
 */
function RequestStream(requestStream, options) {
	var self = this;
	if(!options) options = {};
	if(options.allowedStatusCodes === undefined) {
		options.allowedStatusCodes = [200];
	}
	var inputPassThrough = new PassThrough();
	var outputPassThrough = new PassThrough();
	CompoundDuplex.call(this, inputPassThrough, outputPassThrough);
	requestStream.on('error', function(error) {
		self.emit('error', error);
	});
	requestStream.on('response', function(response) {
		this._currentResponse = response;
		self.emit('response', response);
		if(options.allowedStatusCodes) {
			var statusCode = ''+response.statusCode;
			var statusCodeIsAllowed = false;
			for(var i = 0; i < options.allowedStatusCodes.length; i++) {
				if(''+options.allowedStatusCodes[i] === statusCode) {
					statusCodeIsAllowed = true;
				}
			}
			if(!statusCodeIsAllowed) {
				self.emit('error', new Error('Received error status code: ' + statusCode));
			}
		}
	});
	if(requestStream.method !== 'GET') {
		inputPassThrough.pipe(requestStream, { noConvert: true });
	}
	requestStream.pipe(outputPassThrough);
	this._requestStream = requestStream;
}
inherits(RequestStream, CompoundDuplex);

RequestStream.prototype.getInternalRequestStream = function() {
	return this._requestStream;
};

RequestStream.prototype._abortStream = function() {
	this._requestStream.destroy();
};

RequestStream.prototype.getResponse = function() {
	return this._currentResponse || null;
};

module.exports = RequestStream;
