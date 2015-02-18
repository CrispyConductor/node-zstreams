var Transform = require('../transform');
var inherits = require('util').inherits;

/**
 * IntersperseStream intersperses a seperator between chunks in the stream
 *
 * @class IntersperseStream
 * @constructor
 * @extends Transform
 * @param {String|Object|Number} [seperator='\n'] - Seperator to push between chunks
 * @param {Object} [options] - Stream options object
 */
function IntersperseStream(seperator, options) {
	if(typeof seperator === 'object') {
		options = seperator;
		seperator = null;
	}
	options = !options ? {} : options;

	Transform.call(this, options);

	this._buffer = null;
	this._seperator = (seperator === null || seperator === undefined) ? '\n' : seperator;
	this._first = true;
}
inherits(IntersperseStream, Transform);

IntersperseStream.prototype._transform = function(chunk, encoding, cb) {
	if(!this._buffer) {
		this._buffer = chunk;
		return cb();
	}

	this.push(this._buffer);
	this.push(this._seperator);

	this._buffer = chunk;
	cb();
};

IntersperseStream.prototype._flush = function(cb) {
	this.push(this._buffer);
	cb();
};

module.exports = IntersperseStream;
