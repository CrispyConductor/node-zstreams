var expect = require('chai').expect;

var zstreams = require('../lib');
var CompoundDuplex = zstreams.CompoundDuplex;
var PassThrough = zstreams.PassThrough;
var SplitStream = zstreams.SplitStream;
var inherits = require('util').inherits;

function TestCompoundDuplexStream(thru) {
	CompoundDuplex.call(
		this,
		new PassThrough()
			.pipe(new SplitStream(' '))
			.throughSync(thru)
	);
}
inherits(TestCompoundDuplexStream, CompoundDuplex);

describe('CompoundDuplex', function() {

	it('should encapsulate multiple streams', function(done) {

		zstreams.fromString('Hello World')
			.pipe(new TestCompoundDuplexStream(function(str) {
				return str.toUpperCase();
			}))
			.intoArray(function(error, array) {
				expect(error).to.not.exist;
				expect(array).to.deep.equal(['HELLO', 'WORLD']);
				done();
			});

	});

	it('should forward errors from encapsulated streams', function(done) {

		zstreams.fromString('Hello World')
			.pipe(new TestCompoundDuplexStream(function() {
				throw new Error('Test error');
			})).intoArray(function(error, array) {
				expect(error).to.exist;
				expect(array).to.not.exist;
				done();
			});
	});

	it('should utilize _flush properly', function(done) {

		var compound = new TestCompoundDuplexStream(function(str) {
			return str.toUpperCase();
		});
		compound._flush = function(cb) {
			this.push('Again');
			cb();
		};

		zstreams.fromString('Hello World')
			.pipe(compound)
			.intoArray(function(error, array) {
				expect(error).to.not.exist;
				expect(array).to.deep.equal(['HELLO', 'WORLDAGAIN']);
				done();
			});
	});
});
