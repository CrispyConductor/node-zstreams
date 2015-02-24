var Duplex = require('./native').Duplex;
var inherits = require('util').inherits;
var extend = require('extend');
var streamMixins = require('./mixins/_stream');
var readableMixins = require('./mixins/_readable');
var writableMixins = require('./mixins/_writable');

function ZDuplex(options) {
	if(options) {
		if(options.objectMode) {
			options.readableObjectMode = true;
			options.writableObjectMode = true;
		}
		if(options.readableObjectMode && options.writableObjectMode) {
			options.objectMode = true;
		}
	}
	Duplex.call(this, options);
	this._duplexOptions = options;
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
	streamMixins.call(this, Duplex.prototype, options);
	readableMixins.call(this, options);
	writableMixins.call(this, options);
}
inherits(ZDuplex, Duplex);
module.exports = ZDuplex;

extend(ZDuplex.prototype, streamMixins.prototype);
extend(ZDuplex.prototype, readableMixins.prototype);
extend(ZDuplex.prototype, writableMixins.prototype);
