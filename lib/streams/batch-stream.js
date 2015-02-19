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
function BatchStream(batchSize, options) {
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
	this._batchBuffer = [];
}
inherits(BatchStream, Transform);

BatchStream.prototype._transform = function(chunk, encoding, cb) {
	this._batchBuffer.push(chunk);
	if(this._batchBuffer.length >= this._batchSize) {
		this.push(this._batchBuffer);
		this._batchBuffer = [];
	}
	cb();
};

BatchStream.prototype._flush = function(cb) {
	if(this._batchBuffer && this._batchBuffer.length) {
		this.push(this._batchBuffer);
	}
	cb(null);
};

module.exports = BatchStream;
