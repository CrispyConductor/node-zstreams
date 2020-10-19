var expect = require('chai').expect;

var zstreams = require('../lib');
var PassThrough = zstreams.PassThrough;
var StringReadableStream = zstreams.StringReadableStream;
var ThroughStream = zstreams.ThroughStream;
var StringWritableStream = zstreams.StringWritableStream;

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
			/*if(!errorThrown) {
				errorThrown = true;
				verifyErrors();
			}*/
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
			.intoPromise()
			.then(function() {
				throw new Error('Should not resolve successfully')
			})
			.catch(verifyErrors);

		function verifyErrors(err) {
			try {
				expect(err.message).to.equal('Test Error');
				expect(errorStreams.length).to.equal(7);
				expect(errorStreams).to.deep.equal([
					stringReadableStream,
					passThrough1,
					passThrough2,
					errorEmittingStream,
					passThrough3,
					passThrough4,
					stringWritableStream
				]);
				done();
			} catch (err) {
				done(err);
			}
		}

	});

	it('should destruct a pipeline on unignored errors', function(done) {

		var unpipeCount = 0;

		var stringReadableStream = new StringReadableStream('Hello World', { chunkSize: 3 });
		var errorEmittingStream = new ThroughStream(function(chunk, encoding, callback) {
			var error = new Error('Test Error');
			callback(error);
		}).on('unpipe', function() {
			unpipeCount++;
		});
		var stringWritableStream = new StringWritableStream().on('unpipe', function() {
			unpipeCount++;
		});

		stringReadableStream.pipe(errorEmittingStream).pipe(stringWritableStream).intoCallback(function(error) {

			setImmediate(function() {
				expect(error).to.exist;
				expect(error.message).to.equal('Test Error');
				expect(unpipeCount).to.equal(2);
				done();
			});
		});

	});

	it('should resume a stream if an error is ignored', function(done) {

		var errorEmitted = false;

		var stringReadableStream = new StringReadableStream('Hello World', { chunkSize: 3 });
		var errorEmittingStream = new ThroughStream(function(chunk, encoding, callback) {
			if(errorEmitted) {
				callback(null, chunk);
			} else {
				this.push(chunk);
				var error = new Error('Test Error');
				errorEmitted = true;
				callback(error);
			}
		});
		var passThrough = new PassThrough();
		var stringWritableStream = new StringWritableStream();

		stringWritableStream.on('chainerror', function(error) {
			expect(error.message).to.equal('Test Error');
			this.ignoreError();
		});

		stringReadableStream.pipe(errorEmittingStream).pipe(passThrough).pipe(stringWritableStream).intoCallback(function(error) {
			expect(error).to.not.exist;
			var result = stringWritableStream.getString();
			expect(result).to.equal('Hello World');
			done();
		});

	});

});
