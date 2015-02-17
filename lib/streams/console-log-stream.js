var Writable = require('../writable');
var inherits = require('util').inherits;

function ConsoleLogStream(options) {
	Writable.call(this, options);
}
inherits(ConsoleLogStream, Writable);

ConsoleLogStream.prototype._write = function(chunk, encoding, cb) {
	if(chunk instanceof Buffer && !this.isWritableObjectMode()) chunk = chunk.toString('utf8');
	console.log(chunk);
	cb();
};

module.exports = ConsoleLogStream;
