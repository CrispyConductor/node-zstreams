var expect = require('chai').expect;

var zstreams = require('../lib');
var FunctionStream = zstreams.FunctionStream;

describe('FunctionStream', function() {
	it('should create an object stream from a function', function(done) {
		var times = 0;
		new FunctionStream(function(cb) {
			var ret = null;
			if(times++ < 400) {
				ret = 'a';
			}
			cb(null, ret);
		}).intoArray(function(error, array) {
			expect(error).to.not.exist;
			expect(array).to.be.instanceof(Array);
			expect(array).to.have.length(400);

			done();
		});
	});

	it('should handle errors', function(done) {
		new FunctionStream(function(cb) {
			cb(new Error('Erroring out'));
		}).intoArray(function(error) {
			expect(error).to.exist;
			done();
		});
	});
});
