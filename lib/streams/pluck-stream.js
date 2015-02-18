var Transform = require('../transform');
var inherits = require('util').inherits;

/**
 * PluckStream plucks a property from an incoming object. If the property doesn't exist, the object will be skipped.
 * NOTE: objectMode will always be true
 *
 * @class PluckStream
 * @constructor
 * @extends Transform
 * @param {String} [property='value'] - Property to pluck from the objects
 * @param {Object} [options] - Stream options object
 */
function PluckStream(property, options) {
	if(typeof property === 'object') {
		options = property;
		property = null;
	}
	options = !options ? {} : options;

	options.objectMode = true;
	Transform.call(this, options);

	this._property = property || 'value';
}
inherits(PluckStream, Transform);

PluckStream.prototype._transform = function(chunk, encoding, cb) {
	var prop = chunk[this._property];
	if(prop !== null && prop !== undefined) {
		this.push(prop);
	}
	cb();
};

module.exports = PluckStream;
