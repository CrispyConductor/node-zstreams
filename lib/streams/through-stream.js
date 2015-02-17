var Transform = require('../transform');
var inherits = require('util').inherits;

function ThroughStream(options, transformFunc) {
	Transform.call(this, options);
	this._tsTransformFunc = transformFunc;
}
inherits(ThroughStream, Transform);

ThroughStream.prototype._transform = function(chunk, enc, cb) {
	this._tsTransformFunc(chunk, enc, cb);
};

module.exports = ThroughStream;
