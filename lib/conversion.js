var extend = require('extend');
var streamMixins = require('./mixins/_stream');
var readableMixins = require('./mixins/_readable');
var writableMixins = require('./mixins/_writable');

/**
 * @class zstreams
 * @static
 * @method isClassicStream
 * @param {Stream} stream - Stream to check
 * @return {Boolean} - Whether or not the stream is a "classic" stream
 */
function isClassicStream(stream) {
	return !(stream.pipe && (stream.read || (stream.write && !(stream.destroy && stream.end))));
}
exports.isClassicStream = isClassicStream;

/**
 * @class zstreams
 * @static
 * @method isRequestStream
 * @param {Stream} stream - Stream to check
 * @return {Boolean} - Whether or not the stream is a "request" stream
 */
function isRequestStream(stream) {
	return !!(isClassicStream(stream) && !!stream.headers && !!stream.method);
}
exports.isRequestStream = isRequestStream;

/**
 * Convert a Stream into a ZStream. Either by wrapping it, or adding ZStream mixins
 *
 * @class zstreams
 * @static
 * @method convertToZStream
 * @param {Stream} stream - The stream to try converting into a ZStream
 * @param {Object} [options] - If expecting to convert, this will be passed as options into the stream   being instanciated.
 */
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
