var expect = require('chai').expect;

var zstreams = require('../lib');
var StringWritableStream = zstreams.StringWritableStream;
var Readable = zstreams.Readable;

describe('StringWritableStream', function() {
	it('should convert a data stream to a string', function(done) {
		var readStream = new Readable({ objectMode: false });
		readStream._read = function() {
			this.push('a');
			this.push('b');
			this.push('c');
			this.push('d');
			this.push(null);
		};
		var sws = new StringWritableStream({ objectMode: false });
		readStream.pipe(sws).intoCallback(function(error) {
			expect(error).to.not.exist;

			var str = sws.getString();
			expect(str).to.equal('abcd');

			done();
		});
	});

	it('should convert an object stream to a string', function(done) {
		var readStream = new Readable({ objectMode: true });
		readStream._read = function() {
			this.push('a');
			this.push('b');
			this.push('c');
			this.push('d');
			this.push(null);
		};
		var sws = new StringWritableStream({ objectMode: true });
		readStream.pipe(sws).intoCallback(function(error) {
			expect(error).to.not.exist;

			var str = sws.getString();
			expect(str).to.equal('abcd');

			done();
		});
	});
});
