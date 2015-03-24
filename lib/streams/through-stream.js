var Transform = require('../transform');
var inherits = require('util').inherits;

function ThroughStream(transformFunc, options) {
	Transform.call(this, options);
	this._tsTransformFunc = transformFunc;
}
inherits(ThroughStream, Transform);

ThroughStream.prototype._transform = function(chunk, enc, cb) {
	try {
		this._tsTransformFunc(chunk, enc, cb);
	} catch (ex) {
		return cb(ex);
	}
};

module.exports = ThroughStream;
