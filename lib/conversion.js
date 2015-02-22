var extend = require('extend');
var streamMixins = require('./mixins/_stream');
var readableMixins = require('./mixins/_readable');
var writableMixins = require('./mixins/_writable');

function isRequestStream(stream) {
	return !!(stream.pipe && !stream.read && stream.headers);
}

function convertToZStream(stream) {
	if(stream._isZStream) return stream;

	// Streams from npm's 'request' module aren't well-behaved streams and don't
	// conform to the streams2 interface.  This is a special case to try to detect
	// and handle them.
	if(isRequestStream(stream)) {
		// Include this here to avoid circular dependency issues
		var RequestStream = require('./streams/request-stream');
		return new RequestStream(stream);
	}

	var origFuncs = {};
	for(var key in stream) {
		origFuncs[key] = stream[key];
	}
	// Use duck typing in case of multiple stream implementations
	extend(stream, streamMixins.prototype);
	streamMixins.call(stream, origFuncs);
	if(stream.read) {
		extend(stream, readableMixins.prototype);
		readableMixins.call(stream);
	}
	if(stream.write) {
		extend(stream, writableMixins.prototype);
		writableMixins.call(stream);
	}
	return stream;
}

exports.convertToZStream = convertToZStream;
