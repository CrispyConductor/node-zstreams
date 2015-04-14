var Transform = require('../transform');
var inherits = require('util').inherits;
var pasync = require('pasync');

function ThroughStream(transformFunc, options) {
	Transform.call(this, options);
	this._tsTransformFunc = transformFunc;
}
inherits(ThroughStream, Transform);

ThroughStream.prototype._transform = function(chunk, enc, cb) {
	try {
		if (this._tsTransformFunc.length >= 3) {
			// callback
			this._tsTransformFunc(chunk, enc, cb);
		} else {
			// promise or value
			var result = this._tsTransformFunc(chunk, enc);
			if (result && typeof result.then === 'function') {
				result.then(function(result) {
					cb(null, result);
				}, function(err) {
					cb(err);
				}).catch(pasync.abort);
			} else {
				cb(null, result);
			}
		}
	} catch (ex) {
		cb(ex);
	}
};

module.exports = ThroughStream;
