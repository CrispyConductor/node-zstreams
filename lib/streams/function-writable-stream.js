var Writable = require('../writable');
var inherits = require('util').inherits;
var pasync = require('pasync');

function FunctionWritableStream(func, options) {
	Writable.call(this, options);
	if (
		(this.isWritableObjectMode() && func.length >= 2) ||
		(!this.isWritableObjectMode() && func.length >= 3)
	) {
		// callback
		this._eachFunc = func;
	} else if (this.isWritableObjectMode()) {
		this._eachFunc = function(chunk, cb) {
			try {
				var result = func(chunk);
				if (result && typeof result.then === 'function') {
					result.then(function(result) {
						cb(null, result);
					}, function(err) {
						cb(err);
					}).catch(pasync.abort);
				} else {
					cb(null, result);
				}
			} catch (ex) {
				cb(ex);
			}
		};
	} else {
		this._eachFunc = function(chunk, encoding, cb) {
			try {
				var result = func(chunk, encoding);
				if (result && typeof result.then === 'function') {
					result.then(function(result) {
						cb(null, result);
					}, function(err) {
						cb(err);
					}).catch(pasync.abort);
				} else {
					cb(null, result);
				}
			} catch (ex) {
				cb(ex);
			}
		};
	}
}
inherits(FunctionWritableStream, Writable);

FunctionWritableStream.prototype._write = function(chunk, encoding, cb) {
	if(this.isWritableObjectMode()) {
		this._eachFunc(chunk, cb);
	} else {
		this._eachFunc(chunk, encoding, cb);
	}
};

module.exports = FunctionWritableStream;
