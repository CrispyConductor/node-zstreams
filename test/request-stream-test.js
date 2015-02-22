var expect = require('chai').expect;

var zstreams = require('../lib');
var http = require('http');
var request = require('request');
var RequestStream = zstreams.RequestStream;

function TestServer() {
	var server = http.createServer(function(request, response) {
		if(request.method === 'GET' && request.url === '/testdata') {
			response.writeHead(200);
			var counter = 0;
			zstreams.fromFunctionSync(function() {
				if(counter >= 300) {
					return null;
				} else {
					return counter++;
				}
			}).intersperse(',').throughDataSync(function(obj) {
				return ''+obj;
			}).pipe(response);
		} else if(request.method === 'POST' && request.url === '/echo') {
			response.writeHead(200);
			zstreams(request).pipe(response);
		} else if(request.url === 'error') {
			response.writeHead(500);
			zstreams.fromString('test error').pipe(response);
		} else if(request.url === '/reset') {
			request.connection.destroy();
		} else {
			response.writeHead(404);
			zstreams.fromString('not found').pipe(response);
		}
	});
	this.server = server;
	this.port = 48573;
}

TestServer.prototype.start = function(cb) {
	this.server.listen(this.port, '127.0.0.1', cb);
};

TestServer.prototype.destroy = function(cb) {
	this.server.close(cb);
};

TestServer.prototype.getURLBase = function() {
	return 'http://127.0.0.1:' + this.port;
};

describe('Request Streams', function() {

	it('should return streaming data from a get request', function(done) {

		var server = new TestServer();
		server.start(function(error) {
			expect(error).to.not.exist;
			var nextExpected = 0;

			zstreams(request({
				url: server.getURLBase() + '/testdata',
				method: 'GET'
			})).split(',').each(function(obj, cb) {
				var num = parseInt(obj, 10);
				expect(num).to.equal(nextExpected);
				nextExpected++;
				cb();
			}).intoCallback(function(error) {
				expect(error).to.not.exist;
				expect(nextExpected).to.equal(300);
				server.destroy(function(error) {
					expect(error).to.not.exist;
					done();
				});
			});
		});

	});

	it('should allow streaming data to a post request', function(done) {
		var server = new TestServer();
		server.start(function(error) {
			expect(error).to.not.exist;

			zstreams.fromString('hello world').pipe(request({
				url: server.getURLBase() + '/echo',
				method: 'POST'
			})).intoString(function(error, str) {
				expect(error).to.not.exist;
				expect(str).to.equal('hello world');
				server.destroy(function(error) {
					expect(error).to.not.exist;
					done();
				});
			});
		});
	});

	it('should handle connection errors', function(done) {
		var server = new TestServer();
		server.start(function(error) {
			expect(error).to.not.exist;
			zstreams(request({
				url: server.getURLBase() + '/reset',
				method: 'GET'
			})).pipe(new zstreams.BlackholeStream()).intoCallback(function(error) {
				expect(error).to.exist;
				server.destroy(function(error) {
					expect(error).to.not.exist;
					done();
				});
			});
		});
	});

	it('should handle error status codes', function(done) {

		var server = new TestServer();
		server.start(function(error) {
			expect(error).to.not.exist;

			zstreams(request({
				url: server.getURLBase() + '/error',
				method: 'GET'
			})).pipe(new zstreams.BlackholeStream()).intoCallback(function(error) {
				expect(error).to.exist;
				server.destroy(function(error) {
					expect(error).to.not.exist;
					done();
				});
			});
		});

	});

});
