var Transform = require('./native').Transform;
var inherits = require('util').inherits;
var extend = require('extend');
var streamMixins = require('./mixins/_stream');
var readableMixins = require('./mixins/_readable');
var writableMixins = require('./mixins/_writable');

function ZTransform(options) {
	if(options) {
		if(options.objectMode) {
			options.readableObjectMode = true;
			options.writableObjectMode = true;
		}
		if(options.readableObjectMode && options.writableObjectMode) {
			options.objectMode = true;
		}
	}
	Transform.call(this, options);
	// note: exclamation marks are used to convert to booleans
	if(options && !options.objectMode && (!options.readableObjectMode) !== (!options.writableObjectMode)) {
		this._writableState.objectMode = !!options.writableObjectMode;
		this._readableState.objectMode = !!options.readableObjectMode;
	}
	streamMixins.call(this, Transform.prototype, options);
	readableMixins.call(this, options);
	writableMixins.call(this, options);
}
inherits(ZTransform, Transform);
module.exports = ZTransform;

extend(ZTransform.prototype, streamMixins.prototype);
extend(ZTransform.prototype, readableMixins.prototype);
extend(ZTransform.prototype, writableMixins.prototype);

