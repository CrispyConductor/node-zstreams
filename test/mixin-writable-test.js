var expect = require('chai').expect;

var zstreams = require('../lib');
/* jshint ignore:start */
var Promise = Promise || require('es6-promise').Promise;
/* jshint ignore:end */

describe('mixin/_writable', function() {
	it('should convert a writable into a promise', function(done) {
		var promise = zstreams.fromArray(['a', 'b', 'c', 'd']).each(function(entry, cb) {
			cb();
		}).intoPromise();

		expect(promise).to.be.instanceof(Promise);

		promise.then(function() {
			done();
		}, function(error) {
			expect(error).to.not.exist;
			done(new Error('Shouldn\'t be here'));
		});
	});

	it('should handle errors on the promise', function(done) {
		var promise = zstreams.fromFunction(function(cb) {
			cb(new Error('Expected error'));
		}).each(function(entry, cb) { cb(); }).intoPromise();

		expect(promise).to.be.instanceof(Promise);

		promise.then(function() {
			done(new Error('Shouldn\'t be here'));
		}, function(error) {
			expect(error).to.exist;
			done();
		});
	});
});
