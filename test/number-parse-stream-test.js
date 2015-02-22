var expect = require('chai').expect;
var NumberParseStream = require('../lib').NumberParseStream;
var zstreams = require('../lib');

describe('NumberParseStream', function() {
	it('should parse a comma-separated list of numbers', function(done) {
		zstreams.fromString('1,2,34,56,78.9,0').pipe(new NumberParseStream()).intoArray(function(error, array) {
			expect(error).to.not.exist;
			expect(array).to.deep.equal([1, 2, 34, 56, 78.9, 0]);
			done();
		});
	});
});
