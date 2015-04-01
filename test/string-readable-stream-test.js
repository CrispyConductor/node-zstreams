var expect = require('chai').expect;

var zstreams = require('../lib');
var StringReadableStream = zstreams.StringReadableStream;

describe('StringReadableStream', function() {
	it('should output a string', function(done) {
		var testString = 'abcd';
		var srs = new StringReadableStream(testString);

		srs.intoString(function(err, str) {
			expect(err).to.not.exist;
			expect(str).to.equal(testString);
			done();
		});
	});
});
