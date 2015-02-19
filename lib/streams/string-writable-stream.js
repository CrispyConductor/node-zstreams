var Writable = require('../writable');
var inherits = require('util').inherits;

/**
 * StringWritableStream collects a buffer of objects being passed in to turn into a string
 *
 * @class SplitStream
 * @constructor
 * @extends Writable
 */
function StringWritableStream(options) {
	Writable.call(this, options);
	this._buffer = '';
}
inherits(StringWritableStream, Writable);

StringWritableStream.prototype.getString = function() {
	return this._buffer;
};

StringWritableStream.prototype._write = function(chunk, encoding, cb) {
	this._buffer += chunk.toString('utf8');
	cb();
};

module.exports = StringWritableStream;
