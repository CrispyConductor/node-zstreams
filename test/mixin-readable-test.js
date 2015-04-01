var expect = require('chai').expect;
var fs = require('fs');
var zstreams = require('../lib');
var abcdFilePath = __dirname + '/resources/abcd.json';
var outputTestFilePath = __dirname + '/resources/output.json';

describe('mixin/_readable', function() {
	describe('through', function() {
		it('should get all the data and not throw an error', function(done) {
			zstreams.fromFile(abcdFilePath).through(function(obj, cb) {
				expect(obj.toString()).to.equal('"a"\n"b"\n"c"\n"d"\n');
				cb(null, obj);
			}).intoString(function(error) {
				expect(error).to.not.exist;
				done();
			});
		});

		it('should catch thrown errors and covert to stream errors', function(done) {
			zstreams.fromFile(abcdFilePath).through(function(obj, cb) {
				throw new Error();
			}).intoString(function(error) {
				expect(error).to.exist;
				done();
			});
		});
	});

	describe('throughSync', function() {
		it ('should it should catch a thrown error and covert to stream errors', function(done) {
			zstreams.fromFile(abcdFilePath).split().throughSync(function(obj) {
				throw new Error();
			}).intoString(function(error) {
				expect(error).to.exist;
				done();
			});
		});
		it ('should return the first line of the file', function(done) {
			var lines = [];
			zstreams.fromFile(abcdFilePath).split().throughSync(function(chunk) {
				lines.push(chunk);
				return chunk;
			}).intoArray(function(error) {
				expect(lines[0]).to.equal('"a"');
				done();
			});
		});
	});

	describe('intoFile', function() {
		it ('should write to a file and call a callback', function(done) {
			this.timeout(30000);
			var outputFileSize, abcdFileSize;
			zstreams.fromFile(abcdFilePath).throughSync(function(chunk) {
				return chunk.toString('utf8').toUpperCase();
			}).intoFile(outputTestFilePath, function(error) {
				expect(error).to.not.exist;
				fs.stat(outputTestFilePath, function(error, stats) {
					outputFileSize = stats.size;
					fs.stat(abcdFilePath, function(error, stats) {
						abcdFileSize = stats.size;
						expect(abcdFileSize).to.equal(outputFileSize);
						// clean up the file
						fs.unlink(outputTestFilePath, function (err) {
							expect(err).to.not.exist;
							done();
						});
					});
				});
			});
		});
	});
});
