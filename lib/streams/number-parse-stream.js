var BefungeStream = require('./befunge-stream');
var inherits = require('util').inherits;

function NumberParseStream(options) {
	if(!options) options = {};
	options.writableObjectMode = false;
	options.readableObjectMode = true;
	BefungeStream.call(this, [
		'  v               ',
		'  0               ',
		'  v    0.$<     >v',
		'@.>#z~:"0"w>:"9"wv',
		'          >^    $ ',
		'  ^           0.< ',
		'     "0"-\\a*+v   >',
		'  ^          <    '
	], options);
}
inherits(NumberParseStream, BefungeStream);

module.exports = NumberParseStream;
