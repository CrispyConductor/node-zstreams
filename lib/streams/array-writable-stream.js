var Writable = require('../writable');
var inherits = require('util').inherits;

function ArrayWritableStream(options) {
	Writable.call(this, options);
	this._currentArray = [];
}
inherits(ArrayWritableStream, Writable);

ArrayWritableStream.prototype.getArray = function() {
	return this._currentArray;
};

ArrayWritableStream.prototype._write = function(chunk, encoding, cb) {
	this._currentArray.push(chunk);
	cb();
};

module.exports = ArrayWritableStream;
