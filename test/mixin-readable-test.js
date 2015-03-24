var expect = require('chai').expect;

var zstreams = require('../lib');
var file = __dirname + '/resources/abcd.json';

describe('mixin/_readable', function() {
	describe('through', function() {
		it('should get all the data and not throw an error', function(done) {
			zstreams.fromFile(file).through(function(obj, cb) {
				expect(obj.toString()).to.equal('"a"\n"b"\n"c"\n"d"\n');
				cb(null, obj);
			}).intoCallback(function(error) {
				expect(error).to.not.exist;
				done();
			});
		});

		it('should catch thrown errors and covert to stream errors', function(done) {
			zstreams.fromFile(file).through(function(obj, cb) {
				throw new Error();
			}).intoCallback(function(error) {
				expect(error).to.exist;
				done();
			});
		});
	});

	describe('throughSync', function() {
		it ('should it should catch a thrown error and covert to stream errors', function(done) {
			zstreams.fromFile(file).split().throughSync(function(obj) {
				throw new Error();
			}).intoCallback(function(error) {
				expect(error).to.exist;
				done();
			});
		});
		it ('should return the first line of the file', function(done) {
			zstreams.fromFile(file).split().throughSync(function(chunk, encoding) {
				expect(chunk).to.equal('"a"');
				done();
			});
		});
	});
});
