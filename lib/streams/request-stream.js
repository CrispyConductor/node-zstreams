var ClassicDuplex = require('./classic-duplex');
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
 * @param {String[]|Number[]|Null} [options.allowedStatusCodes=[200, 201, 202, 203, 204, 205, 206]] -
 *   If a response is received with a HTTP status code not in this list, it is considered an error.
 * @param {Boolean} [options.readErrorResponse=true] - If set to false,
 *   it disables unpiping the stream and reading in the full response body when an error
 *   status code is received.
 */
function RequestStream(requestStream, options) {
	var self = this;
	if(!options) options = {};
	if(options.allowedStatusCodes === undefined) {
		options.allowedStatusCodes = [200, 201, 202, 203, 204, 205, 206];
	}
	if(options.readErrorResponse === undefined) {
		options.readErrorResponse = true;
	}
	ClassicDuplex.call(this, requestStream, options);
	this._readErrorResponse = !!options.readErrorResponse;
	this._allowedStatusCodes = options.allowedStatusCodes;

	requestStream.on('response', function(response) {
		self._currentResponse = response;
		self.emit('response', response);
		if(Array.isArray(self._allowedStatusCodes)) {
			var statusCode = ''+response.statusCode;
			var statusCodeIsAllowed = false;
			for(var i = 0; i < self._allowedStatusCodes.length; i++) {
				if(''+self._allowedStatusCodes[i] === statusCode) {
					statusCodeIsAllowed = true;
				}
			}
			if(!statusCodeIsAllowed) {
				self._handleErrorInResponse(response, new Error('Received error status code: ' + statusCode));
			}
		}
	});
	if(requestStream.method === 'GET') {
		this._compoundWritable.end();
	}
}
inherits(RequestStream, ClassicDuplex);

RequestStream.prototype._handleErrorInResponse = function(response, error) {
	var self = this;
	if(this._readErrorResponse !== false) {
		this._internalReadable.unpipe(this._compoundReadable);
		this._internalReadable.intoString(function(error2, string) {
			if(error2) {
				// Emit error from intoString if it happens
				self.emit('error', error2);
			} else {
				// Set responseBody on the error
				error.responseBody = string;
				self.emit('error', error);
			}
		});
	} else {
		this.emit('error', error);
	}
};

RequestStream.prototype._abortStream = function() {
	var zSuperObj = this._zSuperObj;
	var requestStream = this._internalStream;
	// Abort the internal stream if possible
	if(requestStream && typeof requestStream.abort === 'function') {
		requestStream.abort();
	}
	
	if(zSuperObj && typeof zSuperObj._abortStream === 'function') {
		zSuperObj._abortStream();
	}
};

RequestStream.prototype._handleErrorInResponse = function(response, error) {
	var self = this;
	if(this._readErrorResponse !== false) {
		this._internalReadable.unpipe(this._compoundReadable);
		this._internalReadable.intoString(function(error2, string) {
			if(error2) {
				// Emit error from intoString if it happens
				self.emit('error', error2);
			} else {
				// Set responseBody on the error
				error.responseBody = string;
				self.emit('error', error);
			}
		});
	} else {
		this.emit('error', error);
	}
};

module.exports = RequestStream;
