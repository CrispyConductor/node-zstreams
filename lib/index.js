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
 * @param {Object} [options] - Stream options object
 * @return {ArrayReadableStream}
 */
module.exports.fromArray = function(array, options) {
	return new module.exports.ArrayReadableStream(array, options);
};

/**
 * Convenience function to call fs.createReadStream() from the specified path and options.
 *
 * @param {String} path - File path
 * @param {Object} options - options to fs.createReadStream()
 * @return {Readable}
 */
module.exports.fromFile = function(path, options) {
	return module.exports(fs.createReadStream(path, options));
};

/**
 * Convenience function to construct a FunctionStream from a given function
 *
 * @param {Function} func - Function to become stream
 * @param {Object} [options] - Stream options object
 * @return {FunctionStream}
 */
module.exports.fromFunction = function(generatorFunc, options) {
	return new module.exports.FunctionStream(generatorFunc, options);
};

/**
 * Convenience function to construct a StringReadableStream from a given string
 *
 * @param {String} str - The string to output
 * @param {Object} [options] - Stream options object
 * @return {StringReadableStream}
 */
module.exports.fromString = function(str, options) {
	return new module.exports.StringReadableStream(str, options);
};

/**
 * Convenience function to construct a FunctionStream from a given synchronous function
 *
 * @param {Function} func - Function to become stream
 * @param {Object} [options] - Stream options object
 * @return {FunctionStream}
 */
module.exports.fromFunctionSync = function(generatorFunc, options) {
	return new module.exports.FunctionStream(function(cb) {
		try {
			cb(null, generatorFunc());
		} catch(ex) {
			cb(ex);
		}
	}, options);
};

/**
 * Convenience function to use the 'request' module to make a request and wrap it
 * in a RequestStream zstreams stream.  Parameters are identical to that of 'request'
 * with the addition of allowing options specific to RequestStream.
 *
 * @param {[String]} url - Optional url (can also be included in options)
 * @param {Object} options - Options object containing options to request and RequestStream
 * @return {RequestStream}
 */
module.exports.request = function(url, options) {
	// Include this here because request is an optional dependency
	var request = require('request');

	if(typeof url === 'object') {
		options = url;
		url = null;
	}
	if(!options) options = {};
	if(url) {
		options.url = url;
	}
	var requestStreamOptions = {};
	if(options.allowedStatusCodes) requestStreamOptions.allowedStatusCodes = options.allowedStatusCodes;
	if(options.readErrorResponse) requestStreamOptions.readErrorResponse = options.readErrorResponse;
	delete options.allowedStatusCodes;
	delete options.readErrorResponse;

	return new module.exports.RequestStream(request(options), requestStreamOptions);
};
