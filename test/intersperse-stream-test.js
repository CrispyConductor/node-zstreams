var expect = require('chai').expect;

var zstreams = require('../lib');
var Readable = zstreams.Readable;
var IntersperseStream = zstreams.IntersperseStream;

describe('IntersperseStream', function() {
	it('should intersperse a seperator into a data stream', function(done) {
		var readStream = new Readable({ objectMode: false });
		readStream._first = true;
		readStream._read = function(size) {
			if(this._first) {
				this._first = false;
			} else {
				this.push(null);
				return;
			}
			this.push('a');
			this.push('b');
			this.push('c');
			this.push('d');
		};
		var is = new IntersperseStream(' ');
		readStream.pipe(is).intoString(function(error, string) {
			expect(error).to.not.exist;
			expect(string).to.equal('a b c d');

			done();
		});
	});

	it('should intersperse a seperator into an object stream', function(done) {
		var readStream = new Readable({ objectMode: true });
		readStream._first = true;
		readStream._read = function(size) {
			if(this._first) {
				this._first = false;
			} else {
				this.push(null);
				return;
			}
			this.push({ a: 'a' });
			this.push({ b: 'b' });
			this.push({ c: 'c' });
			this.push({ d: 'd' });
		};
		var is = new IntersperseStream(' ', { objectMode: true });
		readStream.pipe(is).toArray(function(error, array) {
			expect(error).to.not.exist;
			expect(array).to.be.instanceof(Array);
			expect(array.length).to.equal(7);

			expect(array).to.contain({ a: 'a' });
			expect(array).to.contain({ b: 'b' });
			expect(array).to.contain({ c: 'c' });
			expect(array).to.contain({ d: 'd' });
			expect(array).to.contain(' ');

			done();
		});
	});

	it('should intersperse "\n" by default', function(done) {
		var readStream = new Readable({ objectMode: true });
		readStream._first = true;
		readStream._read = function(size) {
			if(this._first) {
				this._first = false;
			} else {
				this.push(null);
				return;
			}
			this.push('a');
			this.push('b');
			this.push('c');
			this.push('d');
		};
		var is = new IntersperseStream({ objectMode: true });
		readStream.pipe(is).toArray(function(error, array) {
			expect(error).to.not.exist;
			expect(array).to.be.instanceof(Array);
			expect(array.length).to.equal(7);

			expect(array).to.contain('a');
			expect(array).to.contain('b');
			expect(array).to.contain('c');
			expect(array).to.contain('d');
			expect(array).to.contain('\n');

			done();
		});
	});

	it('should not put seperators before or after the start/end of the stream', function(done) {
		var readStream = new Readable({ objectMode: true });
		readStream._first = true;
		readStream._read = function(size) {
			if(this._first) {
				this._first = false;
			} else {
				this.push(null);
				return;
			}
			this.push({ a: 'a' });
		};
		var is = new IntersperseStream({ objectMode: true });
		readStream.pipe(is).toArray(function(error, array) {
			expect(error).to.not.exist;
			expect(array).to.be.instanceof(Array);
			expect(array.length).to.equal(1);

			expect(array).to.contain({ a: 'a' });

			done();
		});
	});
});
