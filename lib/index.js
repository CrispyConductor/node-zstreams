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

