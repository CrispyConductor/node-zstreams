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

	this._intersperseBuffer = null;
	this._intersperseSeperator = (seperator === null || seperator === undefined) ? '\n' : seperator;
}
inherits(IntersperseStream, Transform);

IntersperseStream.prototype._transform = function(chunk, encoding, cb) {
	if(this._intersperseBuffer === null) {
		this._intersperseBuffer = chunk;
		return cb();
	}

	this.push(this._intersperseBuffer);
	this.push(this._intersperseSeperator);

	this._intersperseBuffer = chunk;
	cb();
};

IntersperseStream.prototype._flush = function(cb) {
	if(this._intersperseBuffer !== null) {
		this.push(this._intersperseBuffer);
	}
	cb();
};

module.exports = IntersperseStream;
