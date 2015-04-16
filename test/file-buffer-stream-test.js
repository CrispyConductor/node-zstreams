var expect = require('chai').expect;
var fs = require('fs');

var zstreams = require('../lib');
var FileBufferStream = zstreams.FileBufferStream;

describe('FileBufferStream', function() {

	it('should pass through all data', function(done) {
		var genCount = 0;
		var readCount = 0;
		var totalCount = 1000;
		zstreams
			.fromFunction(function(cb) {
				if (genCount < totalCount) {
					cb(null, genCount++);
				} else {
					cb(null, null);
				}
			})
			.intersperse('\n')
			.throughData(function(obj) {
				return new Buffer('' + obj, 'utf8');
			})
			.pipe(new FileBufferStream())
			.split()
			.each(function(str, cb) {
				var num = parseInt(str);
				expect(num).to.equal(readCount);
				readCount++;
				cb();
			}).intoCallback(function(err) {
				if (err) return done(err);
				expect(readCount).to.equal(totalCount);
				done();
			});
	});

	it('should buffer data for slow streams', function(done) {
		this.timeout(20000);
		var genCount = 0;
		var readCount = 0;
		var totalCount = 20000;
		zstreams
			.fromFunction(function(cb) {
				if (genCount < totalCount) {
					cb(null, genCount++);
				} else {
					cb(null, null);
				}
			})
			.intersperse('\n')
			.throughData(function(obj) {
				return new Buffer('' + obj, 'utf8');
			})
			.pipe(new FileBufferStream())
			.split()
			.each(function(str, cb) {
				var num = parseInt(str);
				expect(num).to.equal(readCount);
				readCount++;
				if (readCount >= totalCount - 1000 || readCount < 1000) {
					setTimeout(cb, 2);
				} else {
					cb();
				}
			}).intoCallback(function(err) {
				if (err) return done(err);
				expect(readCount).to.equal(totalCount);
				done();
			});
	});

		it('should remove file when done', function(done) {
		var genCount = 0;
		var readCount = 0;
		var totalCount = 1000;
		var fileBufferStream = new FileBufferStream();
		zstreams
			.fromFunction(function(cb) {
				if (genCount < totalCount) {
					cb(null, genCount++);
				} else {
					cb(null, null);
				}
			})
			.intersperse('\n')
			.throughData(function(obj) {
				return new Buffer('' + obj, 'utf8');
			})
			.pipe(fileBufferStream)
			.split()
			.each(function(str, cb) {
				var num = parseInt(str);
				expect(num).to.equal(readCount);
				readCount++;
				cb();
			}).intoCallback(function(err) {
				if (err) return done(err);
				expect(readCount).to.equal(totalCount);
				setTimeout(function() {
					expect(fs.existsSync(fileBufferStream.getFilename())).to.be.false;
					done();
				}, 50);
			});
	});

});
