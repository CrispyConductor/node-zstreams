var expect = require('chai').expect;

var zstreams = require('../lib');
var http = require('http');

function TestServer() {
	var server = http.createServer(function(request, response) {
		if(request.method === 'GET' && request.url === '/testdata') {
			response.writeHead(200);
			zstreams.fromFunctionSync(function() {
				
			});
		} else if(request.method === 'POST' && request.url === 'echo') {

		} else {

		}
	});
}

TestServer.prototype.start = function(cb) {

};

TestServer.prototype.destroy = function(cb) {

};

TestServer.prototype.getURLBase = function() {

};

describe('Request Streams', function() {
	it('should return streaming data from a get request', function(done) {
		
	});
});
