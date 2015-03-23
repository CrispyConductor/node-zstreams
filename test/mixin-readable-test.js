var expect = require('chai').expect;

var zstreams = require('../lib');

describe('mixin/_readable', function() {
	describe('through', function() {
		it('should get all the data and not throw an error', function(done) {
			zstreams.fromFile(__dirname + '/resources/abcd.json').through(function(obj, cb) {
				expect(obj.toString()).to.equal('"a"\n"b"\n"c"\n"d"\n');
				cb(null, obj);
			}).intoCallback(function(error) {
				expect(error).to.not.exit;
				done();
			});
		});

		it('should catch thrown errors and covert to stream errors', function(done) {
			zstreams.fromFile(__dirname + '/resources/abcd.json').through(function(obj, cb) {
				throw new Error();
			}).intoCallback(function(error) {
				expect(error).to.exist;
				done();
			});
		});
	});
});
