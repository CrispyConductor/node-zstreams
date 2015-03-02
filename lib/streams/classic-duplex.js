var CompoundDuplex = require('./compound-duplex');
var PassThrough = require('../passthrough');
var ClassicWritable = require('./classic-writable');
var ClassicReadable = require('./classic-readable');
var inherits = require('util').inherits;
var extend = require('extend');
var classicMixins = require('../mixins/_classic');

/**
 * ClassicDuplex wraps a "classic" duplex stream.
 *
 * @class ClassicDuplex
 * @constructor
 * @extends CompoundDuplex
 * @uses _Classic
 * @param {Stream} stream - The classic stream being wrapped
 * @param {Object} [options] - Stream options
 */
function ClassicDuplex(stream, options) {
	var readable, writable, classicReadable, classicWritable, self = this;

	readable = new PassThrough();
	writable = new PassThrough();
	CompoundDuplex.call(self, writable, readable, options);
	classicMixins.call(this, stream, options);

	classicReadable = this._internalReadable = new ClassicReadable(stream, options);
	classicReadable.on('error', this._duplexHandleInternalError.bind(this));

	classicWritable = this._internalWritable = new ClassicWritable(stream, options);
	classicWritable.on('error', this._duplexHandleInternalError.bind(this));

	writable.pipe(classicWritable);
	classicReadable.pipe(readable);
}
inherits(ClassicDuplex, CompoundDuplex);

ClassicDuplex.prototype._duplexHandleInternalError = function(error) {
	if(error === this._lastError) {
		// Errors in _internalReadable and internalWritable could be fired in both places
		// This ensures the error is only proxied once
		return;
	}
	this._lastError = error;
	this.emit('error', error);
};

module.exports = exports = ClassicDuplex;

extend(ClassicDuplex.prototype, classicMixins.prototype);
