var Readable = require('../readable');
var inherits = require('util').inherits;

/**
 * FunctionStream takes a function with a callback and pushes its output on read
 * NOTE: objectMode will always be true
 *
 * @class FunctionStream
 * @constructor
 * @extends Readable
 * @param {Function} func - Function to generate stream entries
 * @param {Object} [options] - Stream options object
 */
function FunctionStream(func, options) {
	options = !options ? {} : options;

	options.objectMode = true;
	Readable.call(this, options);

	this._functionFunc = func;
}
inherits(FunctionStream, Readable);

FunctionStream.prototype._read = function() {
	var self = this;
	setImmediate(function() {
		self._functionFunc(function(error, entry) {
			if(error) { return self.emit('error', error); }
			self.push(entry);
		});
	});
};

module.exports = FunctionStream;
