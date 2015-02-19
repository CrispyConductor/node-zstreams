var expect = require('chai').expect;

var zstreams = require('../lib');
var Readable = zstreams.Readable;
var SplitStream = zstreams.SplitStream;

describe('SplitStream', function() {
	it('should split a data stream', function(done) {
		var readStream = new Readable({ objectMode: false });
		readStream._first = true;
		readStream._read = function(size) {
			if(this._first) {
				this._first = false;
			} else {
				this.push(null);
				return;
			}
			this.push('qqqqqq qqqqqq qqqqqq qqqqqq qqqq');
			this.push('qq qqqqqq qqqqqq qqqqqq');
		};
		var ss = new SplitStream(' ');
		readStream.pipe(ss).toArray(function(error, array) {
			expect(error).to.not.exist;
			expect(array).to.be.instanceof(Array);
			expect(array.length).to.equal(8);


			array.forEach(function(entry) {
				expect(entry).to.equal('qqqqqq');
			});

			done();
		});
	});

	it('should split by /\\r?\\n/ by default', function(done) {
		var readStream = new Readable({ objectMode: false });
		readStream._first = true;
		readStream._read = function(size) {
			if(this._first) {
				this._first = false;
			} else {
				this.push(null);
				return;
			}
			this.push('qqqqqq\nqqqqqq\r\nqqqqqq\nqqqqqq');
		};
		var ss = new SplitStream();
		readStream.pipe(ss).toArray(function(error, array) {
			expect(error).to.not.exist;
			expect(array).to.be.instanceof(Array);
			expect(array.length).to.equal(4);


			array.forEach(function(entry) {
				expect(entry).to.equal('qqqqqq');
			});

			done();
		});
	});

	it('should split / +/ correctly', function(done) {
		var readStream = new Readable({ objectMode: true });
		readStream._read = function() {
			this.push('Test ');
			this.push(' Test');
			this.push(null);
		};
		readStream.pipe(new SplitStream(/ +/)).toArray(function(error, array) {
			expect(error).to.not.exist;
			expect(array).to.be.instanceof(Array);
			expect(array).to.have.length(2);

			done();
		});
	});
});
