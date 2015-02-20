var expect = require('chai').expect;

var zstreams = require('../lib');
var CompoundDuplex = zstreams.CompoundDuplex;
var PassThrough = zstreams.PassThrough;
var SplitStream = zstreams.SplitStream;
var inherits = require('util').inherits;

describe('CompoundDuplex', function() {

	it('should encapsulate multiple streams', function(done) {

		function TestCompoundDuplexStream() {
			CompoundDuplex.call(this,
				new PassThrough()
				.pipe(new SplitStream(' '))
				.throughSync(function(str) {
					return str.toUpperCase();
				})
			);
		}
		inherits(TestCompoundDuplexStream, CompoundDuplex);

		zstreams.fromString('Hello World').pipe(new TestCompoundDuplexStream()).intoArray(function(error, array) {
			expect(error).to.not.exist;
			expect(array).to.deep.equal(['HELLO', 'WORLD']);
			done();
		});

	});

	it('should forward errors from encapsulated streams', function(done) {
		function TestCompoundDuplexStream() {
			CompoundDuplex.call(this,
				new PassThrough()
				.pipe(new SplitStream(' '))
				.throughSync(function(str) {
					throw new Error('Test error');
				})
			);
		}
		inherits(TestCompoundDuplexStream, CompoundDuplex);

		zstreams.fromString('Hello World').pipe(new TestCompoundDuplexStream()).intoArray(function(error, array) {
			expect(error).to.exist;
			done();
		});
	});

});
