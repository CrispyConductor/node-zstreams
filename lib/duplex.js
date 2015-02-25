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

	// Register listeners for finish (v0.10) and prefinish (v0.12) to run _duplexPrefinish
	this._duplexFinished = false;
	this.once('finish', this._duplexPrefinish.bind(this));
	this.once('prefinish', this._duplexPrefinish.bind(this));

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

/**
 * Used to call flush, then push a null value through to the readable side of the Duplex
 *
 * @method _duplexPrefinish
 * @private
 */
ZDuplex.prototype._duplexPrefinish = function() {
	if(this._duplexFinished) { return; }
	this._duplexFinished = true;
	if(typeof this._flush === 'function') {
		var self = this;
		this._flush(function(error) {
			if(error) {
				self.emit('error', error);
			}
			self.push(null);
		});
	} else {
		this.push(null);
	}
};
