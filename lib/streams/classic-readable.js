var Readable = require('../readable');
var inherits = require('util').inherits;
var extend = require('extend');
var classicMixins = require('../mixins/_classic');

/**
 * ClassicReadable wraps a "classic" readable stream.
 *
 * @class ClassicReadable
 * @constructor
 * @extends Readable
 * @uses _Classic
 * @param {Stream} stream - The classic stream being wrapped
 * @param {Object} [options] - Stream options
 */
function ClassicReadable(stream, options) {
	Readable.call(this, options);
	classicMixins.call(this, stream, options);

	// Readable streams already include a wrapping for Classic Streams
	this.wrap(stream);
}
inherits(ClassicReadable, Readable);

module.exports = ClassicReadable;

extend(ClassicReadable.prototype, classicMixins.prototype);
