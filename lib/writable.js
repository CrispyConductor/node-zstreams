var Transform = require('./native').Transform;
var inherits = require('util').inherits;
var extend = require('extend');
var streamMixins = require('./mixins/_stream');
var writableMixins = require('./mixins/_writable');

function ZWritable(options) {
	if(options && options.writableObjectMode) {
		options.objectMode = true;
	}
	Transform.call(this, options);
	streamMixins.call(this, Transform.prototype, options);
	writableMixins.call(this, options);
}
// ZWritable inherits from Transform so we can use the _flush method
inherits(ZWritable, Transform);
module.exports = ZWritable;

extend(ZWritable.prototype, streamMixins.prototype);
extend(ZWritable.prototype, writableMixins.prototype);

// Make the _read method useless just to override the proper Transform method
ZWritable.prototype._read = function() {
	this.push(null);
};

