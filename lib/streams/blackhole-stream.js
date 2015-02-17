var Writable = require('../writable');
var inherits = require('util').inherits;

function BlackholeStream(options) {
	Writable.call(this, options);
}
inherits(BlackholeStream, Writable);

BlackholeStream.prototype._write = function(chunk, encoding, cb) {
	cb();
};

module.exports = BlackholeStream;
