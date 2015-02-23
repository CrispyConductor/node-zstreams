var Transform = require('../transform');
var inherits = require('util').inherits;

/**
 * SkipStream skips over `n` number of bytes/objects
 * If SkipStream is in object mode, it will skip over entries in Transform.
 * If SkipStream is in data mode, it will skip over bytes
 *
 * @param {Integer} n - The number of bytes/objects to skip
 * @param {Object} options - Stream options object
 */
function SkipStream(n, options) {
	options = options || {};
	Transform.call(this, options);
	
	this._skipObjects = options.objectMode || options.writableObjectMode;
	this._skipN = n;
	this._skipped = 0;
}
inherits(SkipStream, Transform);

SkipStream.prototype._transform = function(chunk, encoding, cb) {
	if(this._skipped < this._skipN) {
		if(this._skipObjects) {
			// Skip the object and continue
			this._skipped++;
			return cb();
		}
		if((this._skipped + chunk.length) < this._skipN) {
			// Skip the full chunk and continue
			this._skipped += chunk.length;
			return cb();
		}
		// Need to slice the chunk, then pass it on
		chunk = chunk.slice(0, 1 + (this._skipN - this._skipped));
		this._skipped = this._skipN;
	}
	cb(null, chunk);
};

module.exports = exports = SkipStream;
