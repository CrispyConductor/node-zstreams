var expect = require('chai').expect;

var zstreams = require('../lib');
var Writable = zstreams.Writable;

describe('Stream ended into functions', function() {
	it.skip('intoCallback should resolve', function(done) {
		var writeStream = new Writable({
			write: function(chunk, encoding, cb) {
				cb();
			}
		});
		zstreams.fromString('abcd').pipe(writeStream);
		setTimeout(function() {
			writeStream.intoCallback(function(error) {
				expect(error).to.not.exist;
				done();
			});
		}, 500);
	});

	it('intoCallback error', function(done) {
		var writeStream = new Writable({
			write: function(chunk, encoding, cb) {
				console.log('heyooo');
				cb();
			}
		});

		console.log('should be inbetween?');

		zstreams.fromString('abcd')
			.through(function(chunk, encoding, cb) {
				throw new Error(123);
				cb();
			})
			.pipe(writeStream);

		console.log('And now we wait...');
		setTimeout(function() {
			writeStream.intoCallback(function(error) {
				console.log('error: ' + error);
				expect(error).to.exist;
				done();
			});
		}, 500);
	});

	it.skip('intoCallback error control', function(done) {
		var writeStream = new Writable({
			write: function(chunk, encoding, cb) {
				cb();
			}
		});

		zstreams.fromString('abcd')
			.through(function(chunk, encoding, cb) {
				throw new Error(123);
			})
			.pipe(writeStream)
			.intoCallback(function(error) {
				console.log('error: ' + error);
				expect(error).to.exist;
				done();
			});
	});

	it.skip('intoPromise should resolve', function(done) {
		var writeStream = new Writable({
			write: function(chunk, encoding, cb) {
				cb();
			}
		});
		zstreams.fromString('abcd').pipe(writeStream);
		setTimeout(function() {
			writeStream.intoPromise()
				.then(function(err, result) {
					console.log('result: ' + result);
					done();
				});
		}, 500);
	});

	it.skip('intoPromise with error', function(done) {
		var writeStream = new Writable({
			write: function(chunk, encoding, cb) {
				throw new Error(123);
			}
		});
		zstreams.fromString('abcd').pipe(writeStream);
		setTimeout(function() {
			writeStream.intoPromise()
				.then(function(err, result) {
					console.log('result: ' + result);
					done();
				});
		}, 500);
	});
});
