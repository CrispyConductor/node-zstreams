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
	if(!(delimiter instanceof RegExp) && typeof delimiter === 'object') {
		options = delimiter;
		delimiter = null;
	}
	options = !options ? {} : options;

	delete options.objectMode;
	options.writableObjectMode = false;
	options.readableObjectMode = true;
	Transform.call(this, options);

	this._splitDelimiter = delimiter || /\r?\n/;
	this._splitBuffer = '';
}
inherits(SplitStream, Transform);

SplitStream.prototype._transform = function(chunk, encoding, cb) {
	var splitArray, i, len, splitIdx, lastElem;

	this._splitBuffer += chunk.toString('utf8');
	splitArray = this._splitBuffer.split(this._splitDelimiter);
	if(splitArray[splitArray.length-1].length === 0) {
		// A delimiter was at the end. Since this could be RegExp, let's put it back into the buffer
		splitArray.pop();
		if(!splitArray.length) {
			// There is nothing here to split or put back
			this._splitBuffer = '';
			return cb();
		} else {
			lastElem = splitArray[splitArray.length-1];
			splitIdx = this._splitBuffer.lastIndexOf(lastElem) + lastElem.length + 1;
			this._splitBuffer = this._splitBuffer.substring(splitIdx);
		}
	} else {
		this._splitBuffer = splitArray.pop();
	}

	if(splitArray.length !== 0 && splitArray[0].length === 0) {
		// A delimiter was at the begining of the buffer, shift out the element
		splitArray.shift();
	}

	for(i = 0, len = splitArray.length; i < len; ++i) {
		this.push(splitArray[i]);
	}
	cb();
};

SplitStream.prototype._flush = function(cb) {
	if(typeof this._splitBuffer === 'string' && this._splitBuffer.length) {
		this.push(this._splitBuffer);
	}
	cb();
};

module.exports = SplitStream;
