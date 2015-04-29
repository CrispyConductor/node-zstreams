var expect = require('chai').expect;

var zstreams = require('../lib');
var Writable = zstreams.Writable;

describe('Stream ended into functions', function() {
	describe('Should return normally with no errors', function() {
		it('intoCallback should return', function(done) {
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
			}, 200);
		});

		it('intoPromise should resolve', function(done) {
			var writeStream = new Writable({
				write: function(chunk, encoding, cb) {
					cb();
				}
			});
			zstreams.fromString('abcd').pipe(writeStream);
			setTimeout(function() {
				writeStream.intoPromise()
					.then(function(error) {
						expect(error).to.not.exist;
						done();
					});
			}, 200);
		});
	});

	describe('Should return with errors', function() {
		it('intoCallback error', function(done) {
			var writeStream = new Writable({
				write: function(chunk, encoding, cb) {
					cb();
				}
			});

			zstreams.fromString('abcd')
				.through(function() {
					throw new Error(123);
				})
				.pipe(writeStream);

			setTimeout(function() {
				writeStream.intoCallback(function(error) {
					expect(error).to.exist;
					done();
				});
			}, 200);
		});

		it('intoPromise with error', function(done) {
			var writeStream = new Writable({
				write: function(chunk, encoding, cb) {
					cb();
				}
			});

			zstreams.fromString('abcd')
				.through(function() {
					throw new Error(123);
				})
				.pipe(writeStream);

			setTimeout(function() {
				writeStream.intoPromise()
					.then(function() {
						//placeholder
					}, function(error) {
						expect(error).to.exist;
						done();
					});
			}, 200);
		});
	});
});
