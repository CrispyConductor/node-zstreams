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
		it('should receive the Readable stream', function(done) {
			var writeStream = new Writable({
				write: function(chunk, encoding, cb) {
					cb();
				}
			});
			count = 0;
			zstreams.fromString('abcd', {chunkSize: 1}).pipe(writeStream).intoCallback(function(error) {
				expect(error).to.not.exist;
				count++;
				expect(count).to.equal(1);
				done();
			});
		});
	});
	describe('object mode', function() {
		it('should receive the Readable stream', function(done) {
			var writeStream = new Writable({
				objectMode: true,
				write: function(chunk, encoding, cb) {
					cb();
				}
			});
			count = 0;
			zstreams.fromString('abcd', {chunkSize: 1}).pipe(writeStream).intoCallback(function(error) {
				expect(error).to.not.exist;
				count++;
				expect(count).to.equal(1);
				done();
			});
		});
	});
});


//TODO: add test for write flush when supported

describe('Duplex._read', function() {
	describe('data mode', function() {
		it('should match what the writable contains', function(done) {
			var duplexStream = new Duplex({
				read: function() {
					this.push('a');
					this.push('b');
					this.push('c');
					this.push('d');
					this.push(null);
				}
			});
			duplexStream.intoString(function(error, str) {
				expect(error).to.not.exist;
				expect(str).to.have.length(4);
				expect(str).to.be.a('string');
				done();
			});
		});
	});

	describe('object mode', function() {
		it('should match what the writable contains', function(done) {
			var duplexStream = new Duplex({
				objectMode: true,
				read: function() {
					this.push('a');
					this.push('b');
					this.push('c');
					this.push('d');
					this.push(null);
				}
			});
			duplexStream.intoString(function(error, str) {
				expect(error).to.not.exist;
				expect(str).to.have.length(4);
				expect(str).to.be.a('string');
				done();
			});
		});
	});
});


describe('Duplex._write', function () {
	describe('data mode', function() {
		it('should receive the Readable stream', function(done) {
			var duplexStream = new Duplex({
				write: function(chunk, encoding, cb) {
					cb();
				}
			});
			count = 0;
			zstreams.fromString('abcd', {chunkSize: 1}).pipe(duplexStream).intoCallback(function(error) {
				expect(error).to.not.exist;
				count++;
				expect(count).to.equal(1);
				done();
			});
		});
	});
	describe('object mode', function() {
		it('should receive the Readable stream', function(done) {
			var duplexStream = new Duplex({
				objectMode: true,
				write: function(chunk, encoding, cb) {
					cb();
				}
			});
			count = 0;
			zstreams.fromString('abcd', {chunkSize: 1}).pipe(duplexStream).intoCallback(function(error) {
				expect(error).to.not.exist;
				count++;
				expect(count).to.equal(1);
				done();
			});
		});
	});
});

//TODO: add test for duplex flush when supported
/*
describe('Transform._transform', function () {
	describe('data mode', function() {
		it('should...', function(done) {
			var transformStream = new Transform ({
				transform: function(data, encoding, cb) {
					cb();
				}
			});
			transformStream.intoString(function(error, str) {
				expect(error).to.not.exist;
				expect(str).to.have.length(4);
				expect(str).to.be.a('string');
				done();
			});
		});
	});
	/*
	describe('object mode', function() {
		it('should receive the Readable stream', function(done) {
			var transformStream = new Transform ({
				objectMode: true,
				transform: function(chunk, encoding, cb) {
					cb();
				}
			});
			transformStream.intoString(function(error, str) {
				expect(error).to.not.exist;
				expect(str).to.have.length(0);
				expect(str).to.be.a('string');
				done();
			});
		});
	});
*/
//});

/*

describe('Transform._flush', function () {
	it('should receive the Readable stream', function(done) {
		var writeStream = new Writable({
			flush: function() {

			}
		});
		zstreams.fromString('beep boop\n').pipe(writeStream).intoCallback(function(error) {
			expect(error).to.not.exist;

			var str = writeStream.getString();
			expect(str).to.equal('abcd');

			done();
		});
	});	
});
*/
});
