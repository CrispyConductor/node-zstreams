var Transform = require('../transform');
var inherits = require('util').inherits;

/**
 * LimitStream limits the output to `n` bytes/objects
 * If LimitStream is in object mode, it will skip over entries in Transform.
 * If LimitStream is in data mode, it will skip over bytes
 *
 * @param {Integer} n - The number of bytes/objects to limit by
 * @param {Object} options - Stream options object
 */
function LimitStream(n, options) {
	options = options || {};
	Transform.call(this, options);
	
	this._limitObjects = options.objectMode || options.writableObjectMode;
	this._limitN = n;
	this._limitted = 0;
}
inherits(LimitStream, Transform);

LimitStream.prototype._transform = function(chunk, encoding, cb) {
	if(this._limitted >= this._limitN) {
		this.push(null);
		return cb();
	}
	if(this._limitObjects) {
		// Add 1 or an object
		this._limitted++;
	} else {
		if((this._limitted + chunk.length) >= this._limitN) {
			// End the stream after this
			this.push(chunk.slice(0, this._limitN - this._limitted));
			this._limitted = this._limitN;
			return cb();
		} else {
			// Add the length of the chunk
			this._limitted += chunk.length;
		}
	}
	cb(null, chunk);
};

module.exports = exports = LimitStream;
