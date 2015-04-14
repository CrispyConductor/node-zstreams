var spectrophotometer = require('spectrophotometer');
var benchset = spectrophotometer.benchset;
var compare = spectrophotometer.compare;
var bench = spectrophotometer.bench;
var zstreams = require('../lib');
var BlackholeStream = zstreams.BlackholeStream;

var readStreamGenerator = function(limit, isObjectMode) {
	var count = 0;
	return zstreams.fromFunction(function(cb) {
		if(count++ < limit) {
			cb(null, Math.random() + ',');
		} else {
			cb(null, null);
		}
	}, { objectMode: isObjectMode });
};

benchset('Stream Chain', function() {
	function makeCompare(name, isObjectMode) {
		compare(name, function() {
			function makeBench(numItems) {
				bench('chain with ' + numItems + ' items', function(done) {
					var readStream = readStreamGenerator(numItems, isObjectMode);
					readStream
						.split(',')
						.throughSync(function(num) {
							return parseFloat(num);
						}).throughSync(function(num) {
							return num * 2;
						}).throughSync(function(num) {
							return {foo: num};
						}).pluck('foo')
						.filterSync(function(num) {
							return num > 1;
						}).intersperse('#')
						.pipe(new BlackholeStream({objectMode: true}))
						.intoCallback(done);
				});
			}
			makeBench(10);
			makeBench(100);
			makeBench(1000);
			makeBench(10000);
		});
	}

	makeCompare('data mode', false);
	makeCompare('objectMode', true);
});

benchset('Stream Chain with async filter', function() {
	function makeCompare(name, isObjectMode) {
		compare(name, function() {
			function makeBench(numItems) {
				bench('chain with ' + numItems + ' items', function(done) {
					var readStream = readStreamGenerator(numItems, isObjectMode);
					readStream
						.split(',')
						.throughSync(function(num) {
							return parseFloat(num);
						}).throughSync(function(num) {
							return num * 2;
						}).throughSync(function(num) {
							return {foo: num};
						}).pluck('foo')
						.filter(function(num, cb) {
							cb(null, num > 1);
						}).intersperse('#')
						.pipe(new BlackholeStream({objectMode: true}))
						.intoCallback(done);
				});
			}
			makeBench(10);
			makeBench(100);
			makeBench(1000);
			makeBench(10000);
		});
	}

	makeCompare('data mode', false);
	makeCompare('objectMode', true);
});
