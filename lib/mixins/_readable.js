var fs = require('fs');

/**
 * Readable mixins for ZReadable streams.
 *
 * This class cannot be instantiated in itself.  Its prototype methods must be added to the prototype
 * of the class it's being mixed into, and its constructor must be called from the superclass's constructor.
 *
 * @class _Readable
 * @constructor
 */
function _Readable() {
	this._zDownstreamStreams = [];
}
module.exports = _Readable;

_Readable.prototype.pipe = function(destination, options) {
	var self = this;

	if(!destination._isZStream) {
		destination = conversion.convertToZStream(destination);
	}

	// Call the parent pipe method
	var retVal = this._zSuperObj.pipe.call(this, destination, options);

	// Add this destination stream to our list of destinations
	this._zDownstreamStreams.push(destination);

	// Mark both this stream and the destination stream as having dirty stream chains
	if(this._currentStreamChain) {
		this._currentStreamChain.dirty = true;
	}
	if(destination._currentStreamChain) {
		destination._currentStreamChain.dirty = true;
	}

	return retVal;
};

_Readable.prototype.unpipe = function(destination) {
	// Call the parent method
	var retVal = this._zSuperObj.unpipe.call(this, destination);

	// Remove this destination from our list of destinations
	if(destination) {
		this._zDownstreamStreams = this._zDownstreamStreams.filter(function(dest) {
			return dest !== destination;
		});
	} else {
		this._zDownstreamStreams = [];
	}

	// Mark our current stream chain as dirty
	// Note that we don't need to do this for destinations because, if they are not already dirty,
	// they share the same stream chain as this stream.
	if(this._currentStreamChain) {
		this._currentStreamChain.dirty = true;
	}

	return retVal;
};

_Readable.prototype.tee = function(destination, options) {
	this.pipe(destination, options);
	return this;
};

_Readable.prototype.getDownstreamStreams = function() {
	return this._zDownstreamStreams;
};

_Readable.prototype.isReadableObjectMode = function() {
	return !!this._readableState.objectMode;
};

/**
 * A "through" stream - an easy way to transform data.
 *
 * @method through
 * @param {Function} transformFunc - Either function(chunk, encoding, cb) for data mode or function(object, cb) for object mode
 * @param {Boolean} objectMode - If set to true or false, will force the through stream to output objects or data
 */
_Readable.prototype.through = function(transformFunc, objectMode) {
	return this.pipe(new ThroughStream(function(chunk, enc, cb) {
		transformFunc.call(this, chunk, cb);
	}, {
		writableObjectMode: this.isReadableObjectMode(),
		readableObjectMode: (objectMode !== undefined) ? objectMode : this.isReadableObjectMode()
	}));
};

/**
 * Like through() but always transforms to objects.
 *
 * @method throughObj
 * @param {Function} transformFunc - Either function(chunk, encoding, cb) for data mode or function(object, cb) for object mode
 */
_Readable.prototype.throughObj = function(transformFunc) {
	return this.through(transformFunc, true);
};

/**
 * Like through() but always transforms to buffers.
 *
 * @method throughData
 * @param {Function} transformFunc - Either function(chunk, encoding, cb) for data mode or function(object, cb) for object mode
 */
_Readable.prototype.throughData = function(transformFunc) {
	return this.through(transformFunc, false);
};

/**
 * Synchronous version of through().
 *
 * @method through
 * @param {Function} transformFunc - Either function(chunk, encoding) for data mode or function(object) for object mode, returns the transformed data
 * @param {Boolean} objectMode - If set to true or false, will force the through stream to output objects or data
 */
_Readable.prototype.throughSync = function(transformFunc, objectMode) {
	return this.through(function() {
		var args = Array.prototype.slice.call(arguments, 0);
		var cb = (typeof args[1] === 'function') ? args[1] : args[2];
		try {
			cb(null, transformFunc.apply(this, args.slice(0, -1)));
		} catch (ex) {
			return cb(ex);
		}
	}, objectMode);
};

_Readable.prototype.throughObjSync = function(transformFunc) {
	return this.throughSync(transformFunc, true);
};

_Readable.prototype.throughDataSync = function(transformFunc) {
	return this.throughSync(transformFunc, false);
};

_Readable.prototype.toArray = function(cb) {
	var ArrayWritableStream = require('../streams/array-writable-stream');
	var arrayWritableStream = new ArrayWritableStream({ objectMode: this.isReadableObjectMode() });
	this.pipe(arrayWritableStream).toCallback(function(error) {
		if(error) {
			cb(error);
		} else {
			cb(null, arrayWritableStream.getArray());
		}
	});
};

_Readable.prototype.toFile = function(path, options) {
	return this.pipe(fs.createWriteStream(path, options));
};

// Include these here to help with circular dependencies
var conversion = require('../conversion');
var ThroughStream = require('../streams/through-stream');
