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
	this._inGeneratorLoop = false;
	this._generatorHasEnded = false;
}
inherits(FunctionStream, Readable);

FunctionStream.prototype._read = function() {
	var self = this;
	if(self._inGeneratorLoop || self._generatorHasEnded) return;
	self._inGeneratorLoop = true;

	function callGeneratorFunc() {
		setImmediate(function() {
			self._functionFunc(function(error, entry) {
				if(error) {
					self.emit('error', error);
					self._inGeneratorLoop = false;
				} else if(self.push(entry) && entry !== null) {
					callGeneratorFunc();
				} else {
					self._inGeneratorLoop = false;
				}
				if(!error && entry === null) {
					self._generatorHasEnded = true;
				}
			});
		});
	}

	callGeneratorFunc();
};

module.exports = FunctionStream;
