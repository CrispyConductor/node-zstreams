var expect = require('chai').expect;

var zstreams = require('../lib');

describe('Readable.each', function() {
	it('should call a function with each stream chunk', function(done) {
		var input = ['a', 'b', 'c', 'd'];
		var buffer = '';
		zstreams.fromArray(input).each(function(obj, cb) {
			buffer += obj;
			cb();
		}).intoCallback(function(error) {
			expect(error).to.not.exist;
			expect(buffer).to.equal('abcd');
			done();
		});
	});
});

