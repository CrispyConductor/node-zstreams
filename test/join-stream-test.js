var expect = require('chai').expect;

var zstreams = require('../lib');
var Readable = zstreams.Readable;
var JoinStream = zstreams.JoinStream;

describe('JoinStream', function() {
	it('should join an object stream into a data stream', function(done) {
		var objs = [ 'a', 'b', 'c', 'd' ];
		var readStream = new Readable({ objectMode: false });
		readStream._first = true;
		readStream._read = function(size) {
			if(this._first) {
				this._first = false;
			} else {
				this.push(null);
				return;
			}
			var self = this;
			objs.forEach(function(obj) {
				self.push(obj);
			});
		};
		var js = new JoinStream();

		readStream.pipe(js).toArray(function(error, array) {
			expect(error).to.not.exist;
			expect(array).to.be.instanceof(Array);
			expect(array.length).to.equal(4);

			objs.forEach(function(obj) {
				expect(array).to.contain(new Buffer(obj.toString('utf8')));
			});

			done();
		});
	});
});
