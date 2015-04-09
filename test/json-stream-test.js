var expect = require('chai').expect;
var fs = require('fs');

var JSONParseStream = require('../lib/streams/json-parse-stream');

describe('JSONParseStream', function() {
	it('should parse a json file into object', function(done) {
		var readStream = fs.createReadStream('./test/resources/all_npm.json');
		var jsonParseStream = new JSONParseStream();
		readStream
		.pipe(jsonParseStream)
		.on('data', function (data){
			// console.log(data);
			expect(data).to.be.an('object');
			expect(data).to.have.all.keys('total_rows', 'offset', 'rows');
			expect(data.total_rows).to.equal(4028);
			expect(data.rows).to.be.instanceof(Array);
			expect(data.rows).to.have.length(4028);
			done();
		})
	});
});

