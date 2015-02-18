var Readable = require('../readable');
var inherits = require('util').inherits;

/**
 * FunctionStream takes a function with callbacks, which pushes BatchStream batches the incoming data into an array of size `batchSize`
 * NOTE: objectMode will always be true
 *
 * @class FunctionStream
 * @constructor
 * @extends Transform
 * @param {Function} func - Function to generate stream entries
 * @param {Object} [options] - Stream options object
 */
function FunctionStream(func, options) {
	options = !options ? {} : options;

	options.objectMode = true;
	Readable.call(this, options);

	this._func = func;
}
inherits(FunctionStream, Readable);

FunctionStream.prototype.callFunc = function(times) {
	this._func(function(error, entry) {
		if(error) { self.emit('error', error); }
		if(self.push(entry)) {
			// Recurse until
			self.callFunc(times-1);
		}
	});
};

FunctionStream.prototype._read = function(size) {
	this.callFunc(size);
};

FunctionStream.prototype._transform = function(chunk, encoding, cb) {
	this._buffer.push(chunk);
	if(this._buffer.length >= this._batchSize) {
		this.push(this._buffer);
		this._buffer = [];
	}
	cb();
};

FunctionStream.prototype._flush = function(cb) {
	this.push(this._buffer);
	cb(null);
};

module.exports = FunctionStream;
