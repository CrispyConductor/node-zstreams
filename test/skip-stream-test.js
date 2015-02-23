var expect = require('chai').expect;

var zstreams = require('../lib');
var SkipStream = zstreams.SkipStream;

describe('SkipStream', function() {
	it('should skip over object streams', function(done) {
		var testArray = ['a', 'b', 'c', 'd'];
		zstreams.fromArray(testArray)
			.pipe(new SkipStream(2, { objectMode: true }))
			.intoArray(function(error, array) {
				expect(error).to.not.exist;
				expect(array).to.be.instanceof(Array);
				expect(array).to.have.length(2);
				done();
			});
	});
	
	it('should skip over data streams', function(done) {
	var testString = 'abcdefghi';
	zstreams.fromString(testString, { chunkSize: 3 })
		.pipe(new SkipStream(4))
		.intoString(function(error, str) {
			expect(error).to.not.exist;
			expect(str).to.have.length(testString.length - 4);
			done();
		});
	});
});
