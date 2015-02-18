var Transform = require('../transform');
var inherits = require('util').inherits;

/**
 * SplitStream splits the incoming data stream based on a delimiter.
 * NOTE: writableObjectMode will always be false and readableObjectMode will always be true
 *
 * @class SplitStream
 * @constructor
 * @extends Transform
 * @param {String|RegEx} [delimiter=/\r?\n/] - Delimiter to split data stream on
 * @param {Object} [options] - Stream options object
 */
function SplitStream(delimiter, options) {
	if(typeof delimiter === 'object') {
		options = delimiter;
		delimiter = null;
	}
	options = !options ? {} : options;

	delete options.objectMode;
	options.writableObjectMode = false;
	options.readableObjectMode = true;
	Transform.call(this, options);

	this._delimiter = delimiter || /\r?\n/;
	this._buffer = '';
}
inherits(SplitStream, Transform);

SplitStream.prototype._transform = function(chunk, encoding, cb) {
	var splitBuffer, i, len;

	this._buffer += chunk.toString('utf8');
	splitBuffer = this._buffer.split(this._delimiter);
	this._buffer = splitBuffer.pop();

	for(i = 0, len = splitBuffer.length; i < len; ++i) {
		this.push(splitBuffer[i]);
	}
	cb();
};

SplitStream.prototype._flush = function(cb) {
	this.push(this._buffer);
	cb();
};

module.exports = SplitStream;
