var extend = require('extend');
var streamMixins = require('./mixins/_stream');
var readableMixins = require('./mixins/_readable');
var writableMixins = require('./mixins/_writable');

function isClassicStream(stream) {
	return !(stream.pipe && (stream.read || (stream.write && !(stream.destroy && stream.end))));
}
exports.isClassicStream = isClassicStream;

function isRequestStream(stream) {
	return !!(isClassicStream(stream) && !!stream.headers && !!stream.method);
}
exports.isRequestStream = isRequestStream;
	
function convertToZStream(stream, options) {
	if(stream._isZStream) return stream;

	if(isRequestStream(stream)) {
		// Request Stream
		return new RequestStream(stream, options);
	}

	if(isClassicStream(stream)) {
		if(stream.readable && stream.writable) {
			// Duplex
			return new ClassicDuplex(stream, options);
		} else if(stream.readable) {
			// Readable
			return new ClassicReadable(stream, options);
		} else {
			// Writable
			return new ClassicWritable(stream, options);
		}
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

var ClassicReadable = require('./streams/classic-readable');
var ClassicWritable = require('./streams/classic-writable');
var ClassicDuplex = require('./streams/classic-duplex');
var RequestStream = require('./streams/request-stream');
