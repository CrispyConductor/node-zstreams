var Transform = require('../transform');
var inherits = require('util').inherits;
var pasync = require('pasync');

/**
 * FilterStream runs a filter function on each chunk passed into it
 * NOTE: objectMode will always be true for a batcher stream
 *
 * @param {Function} filterFunc - Function to filter results once
 *   @param {Boolean} filterFunc.chunk - Chunk/Object being passed through
 *   @param {String} encoding - Chunk encoding
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
	function handleResult(err, result) {
		if (err) {
			cb(err);
		} else {
			if (result) {
				self.push(chunk);
			}
			cb();
		}
	}
	try {
		if (this._filterFunc.length >= 2) {
			// callback
			this._filterFunc(chunk, handleResult);
		} else {
			// promise or value
			var result = this._filterFunc(chunk);
			if (typeof result.then === 'function') {
				result.then(function(result) {
					handleResult(null, result);
				}, function(err) {
					handleResult(err);
				}).catch(pasync.abort);
			} else {
				handleResult(null, result);
			}
		}
	} catch (ex) {
		cb(ex);
	}
};

module.exports = FilterStream;
