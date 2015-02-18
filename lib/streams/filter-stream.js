var Transform = require('../transform');
var inherits = require('util').inherits;

/**
 * FilterStream runs a filter function on each chunk passed into it
 * NOTE: objectMode will always be true for a batcher stream
 *
 * @param {Function} filterFunc - Function to filter results once
 *   @param {Boolean} filterFunc.chunk - Chunk/Object being passed through
 *   @param {Boolean} filterFunc.cb - Asynchronous callback for the filter function (if asynchronous)
 *     @param {Error} [filterFunc.cb.error] - Error from the filter
 *     @param {Boolean} [filterFunc.cb.result] - Result of the filter
 * @param {Object} [options] - Stream options object
 */
function FilterStream(filterFunc, options) {
	options = !options ? {} : options;

	options.objectMode = true;
	Transform.call(this, options);

	this._filterFunc = filterFunc;
}
inherits(FilterStream, Transform);

FilterStream.prototype._transform = function(chunk, encoding, cb) {
	var self = this;
	self._filterFunc(chunk, function(error, result) {
		if(error) { return cb(error); }
		if(result) {
			self.push(chunk);
		}
		cb();
	});
};

module.exports = FilterStream;
