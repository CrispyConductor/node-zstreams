var expect = require('chai').expect;

var zstreams = require('../lib');
var BefungeStream = zstreams.BefungeStream;

describe('BefungeStream', function() {
	it('should execute befunge code, streaming input and output', function(done) {
		var input = '1,2,3,4,5,6,7,8,9,10';
		var expectedOutput = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
		// comma-separated integer streaming parser
		var befungeStream = new BefungeStream([
			'  v               ',
			'  0               ',
			'  v    0.$<     >v',
			'@.>#z~:"0"w>:"9"wv',
			'          >^    $ ',
			'  ^           0.< ',
			'     "0"-\\a*+v   >',
			'  ^          <    '
		], { readableObjectMode: true });

		zstreams.fromString(input).pipe(befungeStream).intoArray(function(error, array) {
			expect(error).to.not.exist;
			expect(array).to.deep.equal(expectedOutput);
			done();
		});
	});

});
