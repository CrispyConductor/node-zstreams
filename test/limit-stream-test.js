var expect = require('chai').expect;

var zstreams = require('../lib');
var LimitStream = zstreams.LimitStream;

describe('LimitStream', function() {
	it('should limit an object stream', function(done) {
		var testArray = ['a', 'b', 'c', 'd', 'e'];
		zstreams.fromArray(testArray)
			.pipe(new LimitStream(2, { objectMode: true }))
			.intoArray(function(error, array) {
				expect(error).to.not.exist;
				expect(array).to.be.instanceof(Array);
				expect(array).to.have.length(2);
				done();
			});
	});
	
	it('should limit a data stream', function(done) {
		var testString = 'abcdefghi';
		zstreams.fromString(testString, { chunkSize: 3 })
			.pipe(new LimitStream(4))
			.intoString(function(error, str) {
				expect(error).to.not.exist;
				expect(str).to.have.length(4);
				done();
			});
	});
});
