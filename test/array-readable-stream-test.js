var expect = require('chai').expect;
var ArrayReadableStream = require('../lib').ArrayReadableStream;

describe('ArrayReadableStream', function() {
	it('should transform an array to an equivalent array', function(done) {
		var arr = [1, 2, 3, 4, 5, 6];
		new ArrayReadableStream(arr).toArray(function(err, result) {
			if(err) { throw err; }
			expect(result).to.be.instanceof(Array);
			expect(result).to.have.length(arr.length);
			for(var i = 0, len = arr.length; i < len; ++i) {
				expect(result[i]).to.equal(arr[i]);
			}
			done();
		});
	});
});
