var expect = require('chai').expect;

var zstreams = require('../lib');
var FilterStream = zstreams.FilterStream;
var ArrayReadableStream = zstreams.ArrayReadableStream;
var Promise = require('es6-promise').Promise;

describe('FilterStream', function() {
	it('should fitler results', function(done) {
		var arrStream = new ArrayReadableStream([0, 1, 2, 3, 4, 5, 6, 7]);
		var fs = new FilterStream(function(entry, cb) {
			cb(null, (entry % 2 === 0));
		});

		arrStream.pipe(fs).intoArray(function(error, array) {
			expect(error).to.not.exist;
			expect(array).to.be.instanceof(Array);
			expect(array.length).to.equal(4);

			array.forEach(function(entry) {
				expect(entry % 2).to.equal(0);
			});

			done();
		});
	});

	it('with promises', function(done) {
		var arrStream = new ArrayReadableStream([0, 1, 2, 3, 4, 5, 6, 7]);
		var fs = new FilterStream(function(entry) {
			return Promise.resolve(entry % 2 === 0);
		});

		arrStream.pipe(fs).intoArray(function(error, array) {
			expect(error).to.not.exist;
			expect(array).to.be.instanceof(Array);
			expect(array.length).to.equal(4);

			array.forEach(function(entry) {
				expect(entry % 2).to.equal(0);
			});

			done();
		});
	});
});
