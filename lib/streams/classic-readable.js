var Readable = require('../readable');
var inherits = require('util').inherits;

function ClassicReadable(stream, options) {
	Readable.call(this, options);
	this._internalStream = stream;

	// Readable streams already include a wrapping for Classic Streams
	this.wrap(stream);
}
inherits(ClassicReadable, Readable);

ClassicReadable.prototype.getInternalStream = function() {
	return this._internalStream;
};

module.exports = ClassicReadable;
