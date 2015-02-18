var PassThrough = require('./native').PassThrough;
var inherits = require('util').inherits;
var extend = require('extend');
var streamMixins = require('./mixins/_stream');
var readableMixins = require('./mixins/_readable');
var writableMixins = require('./mixins/_writable');

function ZPassThrough(options) {
	if(options) {
		if(options.objectMode) {
			options.readableObjectMode = true;
			options.writableObjectMode = true;
		}
		if(options.readableObjectMode && options.writableObjectMode) {
			options.objectMode = true;
		}
	}
	PassThrough.call(this, options);
	// note: exclamation marks are used to convert to booleans
	if(options && !options.objectMode && (!options.readableObjectMode) !== (!options.writableObjectMode)) {
		this._writableState.objectMode = !!options.writableObjectMode;
		this._readableState.objectMode = !!options.readableObjectMode;
	}
	if(options && options.readableObjectMode) {
		this._readableState.highWaterMark = 16;
	}
	if(options && options.writableObjectMode) {
		this._writableState.highWaterMark = 16;
	}
	streamMixins.call(this, PassThrough.prototype, options);
	readableMixins.call(this, options);
	writableMixins.call(this, options);
}
inherits(ZPassThrough, PassThrough);
module.exports = ZPassThrough;

extend(ZPassThrough.prototype, streamMixins.prototype);
extend(ZPassThrough.prototype, readableMixins.prototype);
extend(ZPassThrough.prototype, writableMixins.prototype);

