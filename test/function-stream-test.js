var expect = require('chai').expect;

var zstreams = require('../lib');
var FunctionStream = zstreams.FunctionStream;

describe('FunctionStream', function() {
	it('should create an object stream from a function', function(done) {
		var times = 0;
		new FunctionStream(function(cb) {
			var ret = null;
			if(times++ < 4) {
				ret = 'a';
			}
			cb(null, ret);
		}).toArray(function(error, array) {
			expect(error).to.not.exist;
			expect(array).to.be.instanceof(Array);
			expect(array).to.have.length(4);

			done();
		});
	});

	it('should handle errors', function(done) {
		new FunctionStream(function(cb) {
			cb(new Error('Erroring out'));
		}).toArray(function(error) {
			expect(error).to.exist;
			done();
		});
	});
});
