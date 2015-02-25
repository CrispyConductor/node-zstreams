var Writable = require('../writable');
var inherits = require('util').inherits;

function ClassicWritable(stream, options) {
	var self = this;

	Writable.call(this, options);
	self._internalStream = stream;

	stream.on('error', function(error) {
		self.emit('error', error);
	});

	self._isClosed = false;
	stream.on('close', function() {
		self._isClosed = true;
	});

	self._writeQueue = [];
}
inherits(ClassicWritable, Writable);

ClassicWritable.prototype.getInternalStream = function() {
	return this._internalStream;
};

ClassicWritable.prototype._performWrites = function() {
	if(this._isClosed) { return false; }
	var i, len, bufferObj, writeMore = true;
	if(this._writeQueue.length) {
		for(i = 0, len = this._writeQueue.length; i < len && writeMore; ++i) {
			bufferObj = this._writeQueue.shift();
			writeMore = this._internalStream.write(bufferObj.chunk);
			bufferObj.cb();
		}
		if(i < len) {
			// Queue did not finish writing before being told to stop
			return false;
		}
	}
	// The queue was fully written
	return true;
};

ClassicWritable.prototype._write = function(chunk, encoding, cb) {
	this._writeQueue.push({ chunk: chunk, cb: cb });
	this._performWrites();
};

ClassicWritable.prototype._flush = function(cb) {
	if(this._isClosed) { return cb(); }
	this._internalStream.on('close', cb);
	this._internalStream.end();
};

ClassicWritable.prototype._abortStream = function() {
	if(this._internalStream.destroy) {
		this._internalStream.destroy();
	}
};

module.exports = ClassicWritable;
