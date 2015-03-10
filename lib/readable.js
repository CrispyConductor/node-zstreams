var Readable = require('./native').Readable;
var inherits = require('util').inherits;
var extend = require('extend');
var streamMixins = require('./mixins/_stream');
var readableMixins = require('./mixins/_readable');

/**
 * ZReadable implements the Readable streams interface
 *
 * @class ZReadable
 * @constructor
 * @extends Readable
 * @uses _Stream
 * @uses _Readable
 * @param {Object} [options] - Stream options
 */
function ZReadable(options) {
	if(options) {
		if(options.readableObjectMode) {
			options.objectMode = true;
		}
		//Add support for iojs simplified stream constructor
		if(typeof options.read === 'function') {
			this._read = options.read;
		}
	}
	Readable.call(this, options);
	streamMixins.call(this, Readable.prototype, options);
	readableMixins.call(this, options);
}

inherits(ZReadable, Readable);
module.exports = ZReadable;

extend(ZReadable.prototype, streamMixins.prototype);
extend(ZReadable.prototype, readableMixins.prototype);
