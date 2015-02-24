var extend = require('extend');
var streamMixins = require('./mixins/_stream');
var readableMixins = require('./mixins/_readable');
var writableMixins = require('./mixins/_writable');
var native = require('./native');

function isStreams1(stream) {
	return !!(!(stream instanceof native.Readable) &&
		!(stream instanceof native.Writable) &&
		!(stream instanceof native.Duplex) &&
		stream instanceof native.Stream &&
		stream.pipe &&
		!stream.read);
}

function convertToZStream(stream, options) {
	if(stream._isZStream) return stream;

	if(isStreams1(stream)) {
		if(stream.readable && stream.writable) {
			// Duplex
			return new CompoundDuplex(
				new PassThrough(options),
				new PassThrough(options),
				options
			).wrap(stream);
		} else if(stream.readable) {
			// Readable
			return new Readable(options).wrap(stream);
		} else {
			// Writable streams can be wrapped properly already
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

var Readable = require('./readable');
var PassThrough = require('./passthrough');
var CompoundDuplex = require('./streams/compound-duplex');
