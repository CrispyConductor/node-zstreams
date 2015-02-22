var extend = require('extend');
var streamMixins = require('./mixins/_stream');
var readableMixins = require('./mixins/_readable');
var writableMixins = require('./mixins/_writable');

function convertToZStream(stream) {
	if(stream._isZStream) return stream;
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
