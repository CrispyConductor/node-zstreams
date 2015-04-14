var Readable = require('../readable');
var inherits = require('util').inherits;
var pasync = require('pasync');

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

	function generatorCallback(error, entry) {
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
	}

	function callGeneratorFunc() {
		setImmediate(function() {
			try {
				if (self._functionFunc.length >= 1) {
					// callback
					self._functionFunc(generatorCallback);
				} else {
					var result = self._functionFunc();
					if (result && typeof result.then === 'function') {
						// promise
						result.then(function(result) {
							generatorCallback(null, result);
						}, function(err) {
							generatorCallback(err);
						}).catch(pasync.abort);
					} else {
						// scalar
						generatorCallback(null, result);
					}
				}
			} catch (ex) {
				generatorCallback(ex);
			}
		});
	}

	callGeneratorFunc();
};

module.exports = FunctionStream;
