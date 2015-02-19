var Readable = require('../readable');
var inherits = require('util').inherits;

/**
 * A readable string that outputs data from a string given to the constructor.
 *
 * @class StringReadableStream
 * @constructor
 * @param {String|Buffer} str - The string to output to the stream
 * @param {Object} options - Options for the stream
 * @param {Number} options.chunkSize - The size of chunk to output to the stream, defaults to 1024
 */
function StringReadableStream(str, options) {
	if(!options) options = {};
	delete options.objectMode;
	delete options.readableObjectMode;
	Readable.call(this, options);
	this._currentString = str;
	this._currentStringPos = 0;
	this._stringChunkSize = options.chunkSize || 1024;
}
inherits(StringReadableStream, Readable);

StringReadableStream.prototype._read = function() {
	for(;;) {
		var chunk = this._currentString.slice(this._currentStringPos, this._currentStringPos + this._stringChunkSize);
		this._currentStringPos += this._stringChunkSize;
		if(chunk.length === 0) {
			this.push(null);
			break;
		}
		if(!this.push(chunk)) {
			break;
		}
	}
};

module.exports = StringReadableStream;
