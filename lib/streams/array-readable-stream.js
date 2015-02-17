var Readable = require('../readable');
var inherits = require('util').inherits;

function ArrayReadableStream(array, options) {
	if(!options) options = {};
	if(!options.objectMode) options.objectMode = true;
	Readable.call(this, options);
	this._currentArray = array;
	this._currentArrayPosition = 0;
}
inherits(ArrayReadableStream, Readable);

ArrayReadableStream.prototype._read = function() {
	for(;;) {
		if(this._currentArrayPosition >= this._currentArray.length) {
			this.push(null);
			break;
		}
		if(!this.push(this._currentArray[this._currentArrayPosition++])) {
			break;
		}
	}
};

module.exports = ArrayReadableStream;
