var expect = require('chai').expect;
var fs = require('fs');

var JSONStream = require('../lib/streams/json-stream');

describe('JSONStream', function() {
	it('should parse a json file into object', function(done) {
		var readStream = fs.createReadStream('./assets/sample.json');
		var jsonStream = new JSONStream();
		readStream
		.pipe(jsonStream)
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

