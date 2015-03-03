var expect = require('chai').expect;

var zstreams = require('../lib');
var Readable = zstreams.Readable;
var Writable = zstreams.Writable;
var Duplex = zstreams.Duplex;
var Transform = zstreams.Transform;

describe('iojs simplified stream constructors', function() {
	describe('Readable._read', function () {
		describe('data mode', function() {
			it('should match what the writable contains', function(done) {
				var readStream = new Readable({
					read: function() {
						this.push('a');
						this.push('b');
						this.push('c');
						this.push('d');
						this.push(null);
					}
				});
				readStream.intoString(function(error, str) {
					expect(error).to.not.exist;
					expect(str).to.have.length(4);
					expect(str).to.be.a('string');
					done();
				});
			});
		});
		describe('object mode', function(){
			it('should match what the writable contains', function(done) {
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
				readStream.intoString(function(error, str) {
					expect(error).to.not.exist;
					expect(str).to.have.length(4);
					expect(str).to.be.a('string');
					done();
				});
			});
		});
	});

describe('Writable._write', function () {
	describe('data mode', function() {
		it('should call write 4 times, once for each character in the buffer', function(done) {
			var writeStream = new Writable({
				write: function(chunk, encoding, cb) {
					count++;
					cb();
				}
			});
			var count = 0;
			zstreams.fromString('abcd', {chunkSize: 1})
				.pipe(writeStream)
				.intoCallback(function(error) {
					expect(error).to.not.exist;
					expect(count).to.equal(4);
					done();
				});
		});
	});
	describe('object mode', function() {
		it('should call write 4 times, once for each character in the buffer', function(done) {
			var writeStream = new Writable({
				objectMode: true,
				write: function(chunk, encoding, cb) {
					count++;
					cb();
				}
			});
			var count = 0;
			zstreams.fromString('abcd', {chunkSize: 1})
				.pipe(writeStream)
				.intoCallback(function(error) {
					expect(error).to.not.exist;
					expect(count).to.equal(4);
					done();
				});
		});
	});
});

describe('Writable._flush', function () {
	describe('data mode', function() {
		it('should verify flush is called', function(done) {
			var writeStream = new Writable({
				write: function(chunk, encoding, cb) {
					cb();
				},
				flush: function(cb) {
					flushed = true;
					cb();
				}
			});
			zstreams.fromString('abcd')
				.pipe(writeStream)
				.intoCallback(function(error) {
					expect(error).to.not.exist;
					expect(flushed).to.be.true;
					done();
				});
		});
	});
	describe('object mode', function() {
		it('should verify flush is called', function(done) {
			var writeStream = new Writable({
				objectMode: true,
				write: function(chunk, encoding, cb) {
					cb();
				},
				flush: function(cb) {
					flushed = true;
					cb();
				}
			});
			zstreams.fromString('abcd')
				.pipe(writeStream)
				.intoCallback(function(error) {
					expect(error).to.not.exist;
					expect(flushed).to.be.true;
					done();
				});
		});
	});
});

describe('Duplex._read/write', function() {
	describe('data mode', function() {
		it('should match what the writable contains, call the readable once', function(done) {
			var count = 0;
			var readCount = 0;
			var duplexStream = new Duplex({
				read: function() {
					this.push('a');
					this.push('b');
					this.push('c');
					this.push('d');
					this.push(null);
					readCount++;
				},
				write: function(chunk, encoding, cb) {
					count++;
					cb();
				}
			});
			duplexStream.pipe(duplexStream)
				.intoString(function(error, str) {
					expect(error).to.not.exist;
					expect(str).to.have.length(4);
					expect(str).to.be.a('string');
					expect(count).to.equal(4);
					expect(readCount).to.equal(1);
					done();
				});
		});
	});

	describe('object mode', function() {
		it('should match what the writable contains, call the readable once', function(done) {
			var count = 0;
			var readCount = 0;
			var duplexStream = new Duplex({
				objectMode: true,
				read: function() {
					this.push('a');
					this.push('b');
					this.push('c');
					this.push('d');
					this.push(null);
					readCount++;
				},
				write: function(chunk, encoding, cb) {
					count++;
					cb();
				}
			});
			duplexStream.pipe(duplexStream)
				.intoString(function(error, str) {
					expect(error).to.not.exist;
					expect(str).to.have.length(4);
					expect(str).to.be.a('string');
					expect(count).to.equal(4);
					expect(readCount).to.equal(1);
					done();
				});
		});
	});
});

describe('Duplex._flush', function () {
	describe('data mode', function() {
		it('should verify flush is called', function(done) {
			var flushed = false;
			var duplexStream = new Duplex({
				write: function(chunk, encoding, cb) {
					cb();
				},
				flush: function(cb) {
					flushed = true;
					cb();
				}
			});
			zstreams.fromString('abcd')
				.pipe(duplexStream)
				.intoCallback(function(error) {
					expect(error).to.not.exist;
					expect(flushed).to.be.true;
					done();
				});
		});
	});
	describe('object mode', function() {
		it('should verify flush is called', function(done) {
			var flushed = false;
			var duplexStream = new Duplex({
				objectMode: true,
				write: function(chunk, encoding, cb) {
					cb();
				},
				flush: function(cb) {
					flushed = true;
					cb();
				}
			});
			zstreams.fromString('abcd')
				.pipe(duplexStream)
				.intoCallback(function(error) {
					expect(error).to.not.exist;
					expect(flushed).to.be.true;
					done();
				});
		});
	});
});

describe('Transform._transform', function () {
	describe('data mode', function() {
		it('should prove that empty transform does nothing, but works', function(done) {
			var transformStream = new Transform ({
				transform: function(chunk, encoding, cb) {
					this.push(chunk);
					this.push('abcd');
					cb();
				}
			});
			zstreams.fromString('abcd')
			.pipe(transformStream)
			.intoString(function(error, str) {
				expect(error).to.not.exist;
				expect(str).to.have.length(8);
				expect(str).to.be.a('string');
				done();
			});
		});
	});
	describe('object mode', function() {
		it('should prove that empty transform does nothing, but works', function(done) {
			var transformStream = new Transform ({
				objectMode: true,
				transform: function(chunk, encoding, cb) {
					this.push(chunk);
					this.push('abcd');
					cb();
				}
			});
			zstreams.fromString('abcd')
			.pipe(transformStream)
			.intoString(function(error, str) {
				expect(error).to.not.exist;
				expect(str).to.have.length(8);
				expect(str).to.be.a('string');
				done();
			});
		});
	});
});

describe('Transform._flush', function () {
	describe('data mode', function() {
		it('should verify flush is called', function(done) {
			var flushed = false;
			var transformStream = new Transform({
				transform: function(chunk, encoding, cb) {
					this.push(chunk);
					cb();
				},
				flush: function(cb) {
					flushed = true;
					cb();
				}
			});
			zstreams.fromString('beep boop\n')
				.pipe(transformStream)
				.intoString(function(error, str) {
					expect(error).to.not.exist;
					expect(flushed).to.be.true;
					done();
				});
		});	
	});
	describe('object mode', function() {
		it('should verify flush is called', function(done) {
			var flushed = false;
			var transformStream = new Transform({
				objectMode: true,
				transform: function(chunk, encoding, cb) {
					this.push(chunk);
					cb();
				},
				flush: function(cb) {
					flushed = true;
					cb();
				}
			});
			zstreams.fromString('beep boop\n')
				.pipe(transformStream)
				.intoString(function(error, str) {
					expect(error).to.not.exist;
					expect(flushed).to.be.true;
					done();
				});
		});	
	});
});
});
