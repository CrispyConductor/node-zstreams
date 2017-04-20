var PassThrough = require('../passthrough');
var inherits = require('util').inherits;
var extend = require('extend');
var classicMixins = require('../mixins/_classic');

/**
 * ClassicWritable wraps a "classic" writable stream.
 *
 * @class ClassicWritable
 * @constructor
 * @extends ZPassThrough
 * @uses _Classic
 * @param {Stream} stream - The classic stream being wrapped
 * @param {Object} [options] - Stream options
 */
function ClassicWritable(stream, options) {
	var self = this;

	PassThrough.call(this, options);
	classicMixins.call(this, stream, options);

	stream.on('error', function(error) {
		self.emit('error', error);
	});

	self._isClosed = false;
	stream.on('close', function() {
		self._isClosed = true;
	});

	this._zSuperObj.pipe.call(this, stream);
}
inherits(ClassicWritable, PassThrough);

extend(ClassicWritable.prototype, classicMixins.prototype);

module.exports = ClassicWritable;

