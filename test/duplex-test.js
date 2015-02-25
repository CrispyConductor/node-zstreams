var expect = require('chai').expect;

var zstreams = require('../lib');
var Duplex = zstreams.Duplex;

describe('Duplex', function() {
	it('should properly use the _flush function', function(done) {
		var duplex = new Duplex({ objectMode: true });
		duplex._duplexBuffer = '';
		duplex._read = function(/*n*/) {
			if(this._duplexBuffer.length) {
				this.push(this._duplexBuffer[0]);
				this._duplexBuffer = this._duplexBuffer.slice(1);
				return true;
			}
			return false;
		};
		duplex._write = function(chunk, encoding, cb) {
			this._duplexBuffer += chunk.toString('utf8');
			this._read(this._readableState.highWaterMark);
			cb();
		};
		var flushed = false;
		duplex._flush = function(cb) {
			flushed = true;
			this.push('e');
			cb();
		};

		zstreams.fromArray(['a', 'b', 'c', 'd']).pipe(duplex).intoArray(function(error, array) {
			expect(error).to.not.exist;
			expect(array).to.be.instanceof(Array);
			expect(array).to.have.length(5);
			done();
		});
	});
	
	it('should properly use the _flush function', function(done) {
		var duplex = new Duplex({ objectMode: true });
		duplex._duplexBuffer = '';
		duplex._read = function(/*n*/) {};
		duplex._write = function(chunk, encoding, cb) {
			cb();
		};
		var flushed = false;
		duplex._flush = function(cb) {
			flushed = true;
			cb(new Error('contrived'));
		};

		zstreams.fromArray(['a', 'b', 'c', 'd']).pipe(duplex).intoArray(function(error, array) {
			expect(error).to.exist;
			expect(array).to.not.exist;
			done();
		});
	});
});
