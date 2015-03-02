var expect = require('chai').expect;

var zstreams = require('../lib');
var levelup = require('levelup');
var memdown = require('memdown');

var testArray = [
	{ key: 'one', value: 'a' },
	{ key: 'two', value: 'b' },
	{ key: 'three', value: 'c' },
	{ key: 'four', value: 'd' }
];

describe('levelup', function() {
	it('should wrap levelup.createWriteStream() and levelup.createReadStream() properly', function(done) {
		var db = levelup('write-read-stream', { db: memdown });

		zstreams
			.fromArray(testArray)
			.pipe(db.createWriteStream(), { objectMode: true })
			.intoCallback(function(error) {
				expect(error).to.not.exist;

				zstreams(db.createReadStream(), { objectMode: true })
					.intoArray(function(error, array) {
						expect(error).to.not.exist;
						expect(array).to.be.instanceof(Array);
						expect(array).to.have.length(4);
						testArray.forEach(function(entry) {
							expect(array).to.contain(entry);
						});
						done();
					});
			});
	});
});
