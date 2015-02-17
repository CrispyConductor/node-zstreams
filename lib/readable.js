var Readable = require('./native').Readable;
var inherits = require('util').inherits;
var extend = require('extend');
var streamMixins = require('./mixins/_stream');
var readableMixins = require('./mixins/_readable');

function ZReadable(options) {
	if(options && options.readableObjectMode) {
		options.objectMode = true;
	}
	Readable.call(this, options);
	streamMixins.call(this, Readable.prototype, options);
	readableMixins.call(this, options);
}
inherits(ZReadable, Readable);
module.exports = ZReadable;

extend(ZReadable.prototype, streamMixins.prototype);
extend(ZReadable.prototype, readableMixins.prototype);


