var Transform = require('../transform');
var inherits = require('util').inherits;

/**
 * BatchStream batches the incoming data into an array of size `batchSize`
 * NOTE: objectMode will always be true
 *
 * @class BatchStream
 * @constructor
 * @extends Transform
 * @param {Integer} [batchSize=10] - Size of the batches
 * @param {Object} [options] - Stream options object
 */
function FilterStream(batchSize, options) {
	if(typeof batchSize === 'object') {
		options = batchSize;
		batchSize = null;
	}
	batchSize = parseInt(batchSize);
	batchSize = isNaN(batchSize) ? 10 : batchSize;
	options = !options ? {} : options;

	options.objectMode = true;
	Transform.call(this, options);
	
	this._batchSize = batchSize;
	this._buffer = [];
}
inherits(FilterStream, Transform);

FilterStream.prototype._transform = function(chunk, encoding, cb) {
	this._buffer.push(chunk);
	if(this._buffer.length >= this._batchSize) {
		this.push(this._buffer);
		this._buffer = [];
	}
	cb();
};

FilterStream.prototype._flush = function(cb) {
	this.push(this._buffer);
	cb(null);
};

module.exports = FilterStream;
