var expect = require('chai').expect;

var zstreams = require('../lib');
var Stream = require('stream').Stream;

describe('Classic Streams', function() {
	it('should wrap a classic "readable"', function(done) {
		var readable = new Stream();
		readable.readable = true;
		zstreamReadable = zstreams(readable, { objectMode: true });

		zstreamReadable.intoArray(function(error, array) {
			expect(error).to.not.exist;
			expect(array).to.be.instanceof(Array);
			expect(array).to.have.length(4);
			done();
		});

		zstreamReadable.emit('data', 'a');
		zstreamReadable.emit('data', 'b');
		zstreamReadable.emit('data', 'c');
		zstreamReadable.emit('data', 'd');
		zstreamReadable.emit('end');
	});

	it('should handle classic "readable" errors', function(done) {
		var readable = new Stream();
		readable.readable = true;

		zstreams(readable).intoArray(function(error, array) {
			expect(error).to.exist;
			expect(array).to.not.exist;
			done();
		});

		readable.emit('error', new Error('"readable" error'));
	});

	it('should wrap a classic "writable"', function(done) {
		var writable = new Stream();
		writable.writable = true;

		var count = 0;
		writable.write = function(/*buf*/) {
			count++;
		};
		var destroyed = false;
		writable.destroy = function() {
			destroyed = true;
		};
		var ended = false;
		writable.end = function() {
			ended = true;
		};

		zstreams.fromArray(['a', 'b', 'c', 'd']).pipe(writable).intoCallback(function(error) {
			expect(error).to.not.exist;
			expect(count).to.equal(4);
			expect(destroyed).to.equal(false);
			expect(ended).to.equal(true);
			done();
		});
	});

	it('should handle classic "writable" errors', function(done) {
		var writable = new Stream();
		writable.writable = true;
		writable.write = function(/*buf*/) {
			this.emit('error', new Error('"writable" error'));
		};
		var destroyed = false;
		writable.destroy = function() {
			destroyed = true;
		};
		writable.destroy = function() {};
		var ended = false;
		writable.end = function() {
			ended = true;
		};

		zstreams.fromArray(['a', 'b', 'c', 'd']).pipe(writable).intoCallback(function(error) {
			expect(error).to.exist;
			expect(destroyed).to.equal(false);
			expect(ended).to.equal(false);
			done();
		});
	});

	it('should wrap a classic "duplex"', function(done) {
		var duplex = new Stream();
		duplex.readable = true;
		duplex.writable = true;

		var count = 0;
		duplex.write = function(buf) {
			count++;
			this.emit('data', buf);
		};
		var destroyed = false;
		duplex.destroy = function() {
			destroyed = true;
		};
		var ended = false;
		duplex.end = function() {
			ended = true;
			this.emit('end');
		};

		zstreams.fromArray(['a', 'b', 'c', 'd'])
			.pipe(duplex, { objectMode: true })
			.intoArray(function(error, array) {
				expect(error).to.not.exist;
				expect(count).to.equal(4);
				expect(destroyed).to.equal(false);
				expect(ended).to.equal(true);
				expect(array).to.be.instanceof(Array);
				expect(array).to.have.length(4);
				done();
			});
	});

	it('should handle classic "duplex" errors', function(done) {
		var duplex = new Stream();
		duplex.readable = true;
		duplex.writable = true;
		duplex.write = function(/*buf*/) {
			this.emit('error', new Error('"duplex" error'));
		};
		var destroyed = false;
		duplex.destroy = function() {
			destroyed = true;
		};
		var ended = false;
		duplex.end = function() {
			ended = true;
		};

		zstreams.fromArray(['a', 'b', 'c', 'd'])
			.pipe(duplex, { objectMode: true })
			.intoArray(function(error, array) {
				expect(error).to.exist;
				expect(array).to.not.exist;
				expect(destroyed).to.equal(false);
				expect(ended).to.equal(false);
				done();
			});
	});
});
