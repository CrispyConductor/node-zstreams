var spectrophotometer = require('spectrophotometer');
var benchset = spectrophotometer.benchset;
var compare = spectrophotometer.compare;
var bench = spectrophotometer.bench;
var zstreams = require('../lib');
var BlackholeStream = zstreams.BlackholeStream;
var async = require('neo-async');

var readStreamGenerator = function(limit, inObjectMode) {
	var count = 0;
	return zstreams.fromFunction(function(cb) {
		if(count++ < limit) {
			cb(null, 'abcdefghijklmnopqrstuvwxyz');
		} else {
			cb(null, null);
		}
	}, { objectMode: inObjectMode });
};

benchset('Basic FunctionStream', function() {

	function makeCompare(name, isObjectMode) {
		compare(name, function() {
			function addBenchmarks(numEntries) {
				bench(numEntries + ' entries', function(done) {
					var readStream = readStreamGenerator(numEntries, isObjectMode);
					readStream
						.pipe(new BlackholeStream({objectMode: isObjectMode}))
						.intoCallback(done);
				});
			}

			addBenchmarks(1);
			addBenchmarks(10);
			addBenchmarks(100);
			addBenchmarks(1000);
			addBenchmarks(10000);
		});
	}

	makeCompare('data mode', false);
	makeCompare('object mode', true);
});

benchset('Parallel Basic FunctionStream', function() {

	function makeCompare(name, isObjectMode) {
		compare(name, function() {
			function addBenchmarks(numEntries, numTasks, numParallel) {
				bench(numEntries + ' entries, ' + numParallel + ' in parallel', function(done) {
					async.timesLimit(numTasks, numParallel, function(_timesNum, next) {
						var readStream = readStreamGenerator(numEntries, isObjectMode);
						readStream
							.pipe(new BlackholeStream({objectMode: isObjectMode}))
							.intoCallback(next);
					}, done);
				});
			}
			addBenchmarks(1, 100, 10);
			addBenchmarks(10, 100, 10);
			addBenchmarks(100, 100, 10);
			addBenchmarks(1000, 100, 10);
			addBenchmarks(100, 100, 20);
			addBenchmarks(100, 100, 50);
		});
	}

	makeCompare('data mode, 100 runs', false);
	makeCompare('object mode, 100 runs', true);
});
