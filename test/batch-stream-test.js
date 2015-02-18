var expect = require('chai').expect;

var zstreams = require('../lib');
var BatchStream = zstreams.BatchStream;
var ArrayReadableStream = zstreams.ArrayReadableStream;

describe('BatchStream', function() {
	it('should batch results', function(done) {
		var arrStream = new ArrayReadableStream([0, 1, 2, 3, 4, 5, 6, 7]);
		var bs = new BatchStream(3, {});

		arrStream.pipe(bs).toArray(function(error, arrays) {
			expect(error).to.not.exist;
			expect(arrays).to.be.instanceof(Array);
			expect(arrays.length).to.equal(3);

			var maxLen = 0;
			var minLen = Number.MAX_VALUE;
			arrays.forEach(function(array) {
				expect(array).to.be.instanceof(Array);
				if(array.length > maxLen) {
					maxLen = array.length;
				}
				if(array.length < minLen) {
					minLen = array.length;
				}
			});
			expect(maxLen).to.equal(3);
			expect(minLen).to.equal(2);

			done();
		});
	});

	it('should default batch size to 10', function(done) {
		var arr = [];
		for(var i = 0; i < 34; ++i) {
			arr.push(i);
		}
		var arrStream = new ArrayReadableStream(arr);
		var bs = new BatchStream();

		arrStream.pipe(bs).toArray(function(error, arrays) {
			expect(error).to.not.exist;
			expect(arrays.length).to.equal(4);
			
			done();
		});
	});
});
