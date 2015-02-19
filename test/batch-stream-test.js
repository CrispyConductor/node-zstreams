var expect = require('chai').expect;

var zstreams = require('../lib');
var BatchStream = zstreams.BatchStream;
var ArrayReadableStream = zstreams.ArrayReadableStream;

describe('BatchStream', function() {
	it('should batch results', function(done) {
		var arrStream = new ArrayReadableStream([0, 1, 2, 3, 4, 5, 6, 7]);
		var bs = new BatchStream(3, {});

		arrStream.pipe(bs).intoArray(function(error, arrays) {
			expect(error).to.not.exist;
			expect(arrays).to.be.instanceof(Array);
			expect(arrays).to.have.length(3);

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

		arrStream.pipe(bs).intoArray(function(error, arrays) {
			expect(error).to.not.exist;
			expect(arrays).to.be.instanceof(Array);
			expect(arrays).to.have.length(4);
			
			done();
		});
	});

	it('should not push empty batches', function(done) {
		zstreams.fromArray(['a', 'b', 'c', 'd']).pipe(new BatchStream(1)).intoArray(function(error, arrays) {
			expect(error).to.not.exist;
			expect(arrays).to.be.instanceof(Array);
			expect(arrays).to.have.length(4);

			arrays.forEach(function(array) {
				expect(array).to.be.instanceof(Array);
				expect(array).to.have.length(1);
			});

			done();
		});
	});
});
