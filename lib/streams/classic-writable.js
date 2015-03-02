var Writable = require('../writable');
var inherits = require('util').inherits;
var extend = require('extend');
var classicMixins = require('../mixins/_classic');

/**
 * ClassicWritable wraps a "classic" writable stream.
 *
 * @class ClassicWritable
 * @constructor
 * @extends ZWritable
 * @uses _Classic
 * @param {Stream} stream - The classic stream being wrapped
 * @param {Object} [options] - Stream options
 */
function ClassicWritable(stream, options) {
	var self = this;

	Writable.call(this, options);
	classicMixins.call(this, stream, options);

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

module.exports = ClassicWritable;

extend(ClassicWritable.prototype, classicMixins.prototype);
