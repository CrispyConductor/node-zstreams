var fs = require('fs');

module.exports = require('./conversion').convertToZStream;

module.exports.Readable = require('./readable');
module.exports.Writable = require('./writable');
module.exports.Duplex = require('./duplex');
module.exports.Transform = require('./transform');
module.exports.PassThrough = require('./passthrough');

var streamsDir = __dirname + '/streams';

fs.readdirSync(streamsDir).sort().forEach(function(file) {
	var stats = fs.statSync(streamsDir + '/' + file);
	if (stats.isFile() && file !== 'index.js' && file.slice(-3) === '.js') {
		var name = file.slice(0, -3).split('-').map(function(str) {
			return str[0].toUpperCase() + str.slice(1).toLowerCase();
		}).join('');
		module.exports[name] = require('./streams/' + file);
	}
});

/**
 * Convenience function to construct an ArrayReadableStream from a given array.
 *
 * @param {Object[]} array - Array to convert to a stream
 * @return {ArrayReadableStream}
 */
module.exports.fromArray = function(array) {
	return new module.exports.ArrayReadableStream(array);
};

/**
 * Convenience function to call fs.createReadStream() from the specified path and options.
 *
 * @param {String} path - File path
 * @param {Object} options - options to fs.createReadStream()
 * @return {Readable}
 */
module.exports.fromFile = function(path, options) {
	return fs.createReadStream(path, options);
};
