var expect = require('chai').expect;

var zstreams = require('../lib');

describe('zstreams.fromArray', function() {
	it('should create an object stream from an array', function(done) {
		var input = ['a', 'b', 'c', 'd'];
		var arrayStream = zstreams.fromArray(input)
		arrayStream.toArray(function(error, array) {
			expect(error).to.not.exist;
			expect(arrayStream.isReadableObjectMode()).to.equal(true);
			expect(array).to.be.instanceof(Array);
			expect(array).to.have.length(input.length);

			input.forEach(function(entry, i) {
				expect(array[i]).to.equal(entry);
			});

			done();
		});
	});
});

describe('zstreams.fromFile', function() {
	it('should create a data stream from a file', function(done) {
		var fileStream = zstreams.fromFile(__dirname + '/resources/abcd.json');
		fileStream.intoString(function(error, string) {
			expect(error).to.not.exist;
			expect(fileStream.isReadableObjectMode()).to.equal(false);
			expect(string).to.equal('"a"\n"b"\n"c"\n"d"\n');
			done();
		});
	});
});

describe('zstreams.fromFunction', function() {
	it('should create an object stream from a function', function(done) {
		var times = 0;
		zstreams.fromFunction(function(cb) {
			var ret = null;
			if(times++ < 4) {
				ret = 'a';
			}
			cb(null, ret);
		}).toArray(function(error, array) {
			expect(error).to.not.exist;
			expect(array).to.be.instanceof(Array);
			expect(array).to.have.length(4);

			done();
		});
	});

	it('should handle errors', function(done) {
		zstreams.fromFunction(function(cb) {
			cb(new Error('Erroring out'));
		}).toArray(function(error) {
			expect(error).to.exist;
			done();
		});
	});
});

describe('zstreams.fromFunctionSync', function() {
	it('should create an object stream from a function', function(done) {
		var times = 0;
		zstreams.fromFunctionSync(function() {
			var ret = null;
			if(times++ < 4) {
				ret = 'a';
			}
			return ret;
		}).toArray(function(error, array) {
			expect(error).to.not.exist;
			expect(array).to.be.instanceof(Array);
			expect(array).to.have.length(4);

			done();
		});
	});

	it('should handle errors', function(done) {
		zstreams.fromFunctionSync(function(cb) {
			throw new Error('Erroring out');
		}).toArray(function(error) {
			expect(error).to.exist;
			done();
		});
	});
});
