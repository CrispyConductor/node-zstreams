var CompoundDuplex = require('./compound-duplex');
var PassThrough = require('../passthrough');
var ClassicWritable = require('./classic-writable');
var ClassicReadable = require('./classic-readable');
var inherits = require('util').inherits;

function ClassicDuplex(stream, options) {
	var readable, writable, classicReadable, classicWritable, self = this;

	readable = new PassThrough();
	writable = new PassThrough();
	CompoundDuplex.call(self, writable, readable, options);
	self._internalStream = stream;

	classicReadable = this._internalReadableStream = new ClassicReadable(stream, options);
	classicReadable.on('error', this._duplexHandleInternalError.bind(this));
	
	classicWritable = this._internalWritableStream = new ClassicWritable(stream, options);
	classicWritable.on('error', this._duplexHandleInternalError.bind(this));

	writable.pipe(classicWritable);
	classicReadable.pipe(readable);
}
inherits(ClassicDuplex, CompoundDuplex);

ClassicDuplex.prototype.getInternalStream = function() {
	return this._internalStream;
};

ClassicDuplex.prototype._duplexHandleInternalError = function(error) {
	if(error === this._lastError) { return; }
	this._lastError = error;
	this.emit('error', error);
};

ClassicDuplex.prototype._abortStream = function() {
	if(this._internalStream.destroy) {
		this._internalStream.destroy();
	}
};

module.exports = exports = ClassicDuplex;
