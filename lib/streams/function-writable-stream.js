var Writable = require('../writable');
var inherits = require('util').inherits;

function FunctionWritableStream(func, options) {
	Writable.call(this, options);
	this._eachFunc = func;
}
inherits(FunctionWritableStream, Writable);

FunctionWritableStream.prototype._write = function(chunk, encoding, cb) {
	if(this.isWritableObjectMode()) {
		this._eachFunc(chunk, cb);
	} else {
		this._eachFunc(chunk, encoding, cb);
	}
};

module.exports = FunctionWritableStream;
