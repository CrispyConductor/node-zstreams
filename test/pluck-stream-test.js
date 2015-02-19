var expect = require('chai').expect;

var zstreams = require('../lib');
var Readable = zstreams.Readable;
var PluckStream = zstreams.PluckStream;

describe('PluckStream', function() {
		it('should pluck properties form an object stream', function(done) {
		var readStream = new Readable({ objectMode: true });
		readStream._first = true;
		readStream._read = function(size) {
			if(this._first) {
				this._first = false;
			} else {
				this.push(null);
				return;
			}
			this.push({ a: 'a', value: 'b' });
			this.push({});
			this.push({ a: 'b' });
			this.push({ a: 'c', value: 'another_val' });
			this.push({ a: 'd' });
		};
		var ps = new PluckStream('a');
		readStream.pipe(ps).toArray(function(error, array) {
			expect(error).to.not.exist;
			expect(array).to.be.instanceof(Array);
			expect(array.length).to.equal(4);

			expect(array).to.contain('a');
			expect(array).to.contain('b');
			expect(array).to.contain('c');
			expect(array).to.contain('d');

			done();
		});
	});

	it('should pluck by "value" by default', function(done) {
		var readStream = new Readable({ objectMode: true });
		readStream._first = true;
		readStream._read = function(size) {
			if(this._first) {
				this._first = false;
			} else {
				this.push(null);
				return;
			}

			this.push({ a: 'a', value: 'b' });
			this.push({});
			this.push({ a: 'b' });
			this.push({ a: 'c', value: 'another_val' });
			this.push({ a: 'd' });
		};
		var ps = new PluckStream();
		readStream.pipe(ps).toArray(function(error, array) {
			expect(error).to.not.exist;
			expect(array).to.be.instanceof(Array);
			expect(array.length).to.equal(2);

			expect(array).to.contain('b');
			expect(array).to.contain('another_val');

			done();
		});
	});
});
