var expect = require('chai').expect;
var fs = require('fs');

var JSONParseStream = require('../lib/streams/json-parse-stream');

describe('JSONParseStream', function() {
	it('should parse a json file into object', function(done) {
		var readStream = fs.createReadStream('./assets/sample.json');
		var jsonParseStream = new JSONParseStream();
		readStream
		.pipe(jsonParseStream)
		.on('data', function (data){
			console.log(data);
			expect(data).to.be.an('object');
			expect(data).to.have.all.keys('image', 'jumpable', 'solid', 'corners');
			expect(data.solid).to.be.an('object');
			expect(data.solid).to.have.all.keys('1', '2', '3', '4', '5', '6', '7', '8', '9');
			expect(data.solid['1']).to.be.instanceof(Array);
			expect(data.solid['1']).to.have.length(2);
			done();
		})
	});
});

