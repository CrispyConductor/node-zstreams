var expect = require('chai').expect;
var fs = require('fs');
var zstreams = require('../lib');
var Readable = zstreams.Readable;
var abcdFilePath = __dirname + '/resources/abcd.json';
var outputTestFilePath = __dirname + '/resources/output.json';

describe('Return a promise if no Callback is supplied for into* methods', function() {
	it('intoArray', function(done) {
		var readStream = new Readable({
			objectMode: true,
			read: function() {
				this.push('a');
				this.push('b');
				this.push('c');
				this.push('d');
				this.push(null);
			}
		});
		readStream.intoArray().then(function(result) {
			expect(result).to.be.instanceof(Array);
			expect(result).to.deep.equal(['a', 'b', 'c', 'd']);
			done();
		}).catch(done);
	});

	it('intoFile', function(done) {
		var outputFileSize, abcdFileSize;
		zstreams.fromFile(abcdFilePath).throughSync(function(chunk) {
			return chunk.toString('utf8').toUpperCase();
		}).intoFile(outputTestFilePath).then(function(error) {
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
		}).catch(done);
	});

	it('intoString', function(done) {
		var readStream = new Readable();
		readStream.push('a');
		readStream.push('b');
		readStream.push('c');
		readStream.push('d');
		readStream.push(null);
		readStream.intoString().then(function(result) {
			expect(result).to.equal('abcd');
			done();
		}).catch(done);
	});
});
