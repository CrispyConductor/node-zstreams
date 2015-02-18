var Transform = require('../transform');
var inherits = require('util').inherits;

/**
 * JoinStream joins the incoming object stream into a data stream
 * NOTE: writableObjectMode will always be true and readableObjectMode will always be false
 *
 * @class JoinStream
 * @constructor
 * @extends Transform
 * @param {Object} [options] - Stream options object
 */
function JoinStream(options) {
	options = !options ? {} : options;

	delete options.objectMode;
	options.writableObjectMode = true;
	options.readableObjectMode = false;
	Transform.call(this, options);
}
inherits(JoinStream, Transform);

JoinStream.prototype._transform = function(chunk, encoding, cb) {
	this.push(chunk.toString('utf8'));
	cb();
};

JoinStream.prototype._flush = function(cb) {
	this.push(this._buffer);
	cb();
};

module.exports = JoinStream;
