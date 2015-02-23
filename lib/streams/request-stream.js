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
 * event proxied from the request stream.  Additionally, it will emit errors if an error
 * response code is received (see options.allowedStatusCodes) .  Error emitted because
 * of a disallowed status code will, by default, read in the entire response body before
 * emitting the error, and will assign error.responseBody to be the response body.
 *
 * @class RequestStream
 * @constructor
 * @param {Request} requestStream - The "stream" returned from request()
 * @param {Object} options - Options to change behavior of the stream
 * @param {String[]|Number[]} options.allowedStatusCodes - If a response is received
 * with a HTTP status code not in this list, it is considered an error.  This defaults
 * to [200, 201, 202, 203, 204, 205, 206] .
 * @param {Boolean} options.readErrorResponse - This is true by default.  If set to false,
 * it disables unpiping the stream and reading in the full response body when an error
 * status code is received.
 */
function RequestStream(requestStream, options) {
	var self = this;
	if(!options) options = {};
	if(options.allowedStatusCodes === undefined) {
		options.allowedStatusCodes = [200, 201, 202, 203, 204, 205, 206];
	}
	this._requestStreamOptions = options;
	var inputPassThrough = this._inputPassThrough = new PassThrough();
	var outputPassThrough = this._outputPassThrough = new PassThrough();
	var compoundOutputPassThrough = this._compoundOutputPassThrough = new PassThrough();
	CompoundDuplex.call(this, inputPassThrough, compoundOutputPassThrough);
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
				self._handleErrorInResponse(response, new Error('Received error status code: ' + statusCode));
			}
		}
	});
	if(requestStream.method !== 'GET') {
		inputPassThrough.pipe(requestStream, { noConvert: true });
	}
	outputPassThrough.pipe(compoundOutputPassThrough);
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

RequestStream.prototype._handleErrorInResponse = function(response, error) {
	var self = this;
	if(this._requestStreamOptions.readErrorResponse !== false) {
		this._outputPassThrough.unpipe(this._compoundOutputPassThrough);
		this._outputPassThrough.intoString(function(error2, string) {
			if(error2) {
				console.log('Warning: Error reading error response body', error2);
			} else {
				error.responseBody = string;
			}
			self.emit('error', error);
		});
	} else {
		this.emit('error', error);
	}
};

module.exports = RequestStream;
