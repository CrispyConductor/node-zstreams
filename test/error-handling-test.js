var expect = require('chai').expect;

var zstreams = require('../lib');
var PassThrough = zstreams.PassThrough;
var StringReadableStream = zstreams.StringReadableStream;
var ThroughStream = zstreams.ThroughStream;
var StringWritableStream = zstreams.StringWritableStream;
var inherits = require('util').inherits;

describe('Error Handling', function() {

	it('should emit chainerror events on every stream in a pipeline in order', function(done) {

		var errorStreams = [];

		function testErrorHandler(error) {
			expect(error.message).to.equal('Test Error');
			errorStreams.push(this);
		}
		var errorThrown = false;

		var stringReadableStream = new StringReadableStream('Hello World', { chunkSize: 3 }).on('chainerror', testErrorHandler);
		var passThrough1 = new PassThrough().on('chainerror', testErrorHandler);
		var passThrough2 = new PassThrough().on('chainerror', testErrorHandler);
		var errorEmittingStream = new ThroughStream(function(chunk, encoding, callback) {
			var error = new Error('Test Error');
			callback(error);
			if(!errorThrown) {
				errorThrown = true;
				verifyErrors();
			}
		}).on('chainerror', testErrorHandler);
		var passThrough3 = new PassThrough().on('chainerror', testErrorHandler);
		var passThrough4 = new PassThrough().on('chainerror', testErrorHandler);
		var stringWritableStream = new StringWritableStream().on('chainerror', testErrorHandler);

		stringReadableStream.
			pipe(passThrough1)
			.pipe(passThrough2)
			.pipe(errorEmittingStream)
			.pipe(passThrough3)
			.pipe(passThrough4)
			.pipe(stringWritableStream)

		function verifyErrors() {
			expect(errorStreams.length).to.equal(7);
			done();
		}

	});

});
