var fs = require('fs');
var pasync = require('pasync');
/* jshint ignore:start */
var Promise = Promise || require('es6-promise').Promise;
/* jshint ignore:end */

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

/**
 * Pipe data from this Readable stream into a Writable/Duplex.
 * This method will try to convert the stream unless
 *
 * @method pipe
 * @param {Stream} destination - Stream to start pushing data to
 * @param {Object} [options] - Contains pipe options, as defined by the base `stream` library, or
 *   conversion options, if the stream needs to be converted.
 *   @param {Boolean} [options.noConvert=false] - Option to force a stream to not be converted (this generally shouldn't be used)
 */
_Readable.prototype.pipe = function(destination, options) {
	if(!destination._isZStream && !(options && options.noConvert)) {
		destination = conversion.convertToZStream(destination, options);
	}

	// Call the parent pipe method
	var retVal = this._zSuperObj.pipe.call(this, destination, options);

	// Remove the pipe's default error handler on the destination assigned by the source
	// This interferes in our error handling, and we handle the errors ourselves
	var destinationErrorListeners = destination.listeners('error');
	if(destinationErrorListeners.length >= 1) {
		destination.removeListener('error', destinationErrorListeners[0]);
	}

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
	var writableObjectMode = this.isReadableObjectMode();
	var throughStreamFunc;
	if (
		(writableObjectMode && transformFunc.length >= 2) ||
		(!writableObjectMode && transformFunc.length >= 3)
	) {
		// transformFunc takes a callback
		throughStreamFunc = function(chunk, enc, cb) {
			if (objectMode) {
				transformFunc.call(this, chunk, cb);
			} else {
				transformFunc.call(this, chunk, enc, cb);
			}
		};
	} else {
		// transformFunc does not take a callback; might return a promise
		throughStreamFunc = function(chunk, enc, cb) {
			var result;
			try {
				result = transformFunc.call(this, chunk, enc);
			} catch (ex) {
				cb(ex);
				return;
			}
			if (result && typeof result.then === 'function') {
				// result is a promise
				result.then(function(result) {
					cb(null, result);
				}, function(err) {
					cb(err);
				}).catch(pasync.abort);
			} else {
				// result is a scalar
				cb(null, result);
			}
		};
	}
	return this.pipe(new ThroughStream(throughStreamFunc, {
		writableObjectMode: writableObjectMode,
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
	if (objectMode) {
		return this.through(function(obj, cb) {
			cb(null, transformFunc(obj));
		});
	} else {
		return this.through(function(chunk, enc, cb) {
			cb(null, transformFunc(chunk, enc));
		});
	}
};

_Readable.prototype.throughObjSync = function(transformFunc) {
	return this.throughSync(transformFunc, true);
};

_Readable.prototype.throughDataSync = function(transformFunc) {
	return this.throughSync(transformFunc, false);
};

/**
 * A convenience function to filter results
 *
 * @method filter
 * @param {Function} filterFunc - Function to filter results
 * @param {String|Object|Number} filterFunc.chunk - Chunk/Object to filter
 * @param {Function} [filterFunc.callback] - Optional.  Declare this if using callbacks.
 * @param {Error} [filterFunc.callback.error] - Error from `filterFunc`
 * @param {Boolean} [filterFunc.callback.result] - Result from `filterFunc`
 */
_Readable.prototype.filter = function(filterFunc) {
	return this.pipe(new FilterStream(filterFunc, { objectMode: true }));
};


/**
 * A convenience function to synchronously filter results
 *
 * @method filterSync
 * @param {Function} filterFunc - Function to filter results
 * @param {Function} filterFunc.chunk - Chunk/Object to filter
 */
_Readable.prototype.filterSync = function(filterFunc) {
	return this.filter(function(chunk, cb) {
		try {
			cb(null, filterFunc(chunk));
		} catch(ex) {
			cb(ex);
		}
	});
};

_Readable.prototype.intoArray = function(cb) {
	var arrayWritableStream = new ArrayWritableStream({ objectMode: this.isReadableObjectMode() });
	if(typeof cb === 'function') {
		this.pipe(arrayWritableStream).intoCallback(function(error) {
			if(error) {
				cb(error);
			} else {
				cb(null, arrayWritableStream.getArray());
			}
		});
	} else {
		var self = this;
		return new Promise(function(resolve, reject) {
			self.pipe(arrayWritableStream).intoCallback(function(error) {
				if(error) {
					reject(error);
				} else {
					resolve(arrayWritableStream.getArray());
				}
			});
		});
	}
};

_Readable.prototype.intoFile = function(path, options, cb) {
	if(typeof options === 'function') {
		cb = options;
		options = {};
	}
	if(typeof cb === 'function') {
		return this.pipe(fs.createWriteStream(path, options)).intoCallback(cb);
	} else {
		return this.pipe(fs.createWriteStream(path, options)).intoPromise();
	}
};

_Readable.prototype.intoString = function(cb) {
	var stringWritableStream = new StringWritableStream({ objectMode: this.isReadableObjectMode() });
	if(typeof cb === 'function') {
		this.pipe(stringWritableStream).intoCallback(function(error) {
			if(error) {
				cb(error);
			} else {
				cb(null, stringWritableStream.getString());
			}
		});
	} else {
		var self = this;
		return new Promise(function(resolve, reject) {
			self.pipe(stringWritableStream).intoCallback(function(error) {
				if(error) {
					reject(error);
				} else {
					resolve(stringWritableStream.getString());
				}
			});
		});
	}
};

/**
 * Splits the incoming data stream into discrete objects
 *
 * @method split
 * @param {String|RegEx} [delimiter=/\r?\n/] - Delimiter to split the incoming buffer
 */
_Readable.prototype.split = function(delimiter) {
	delimiter = delimiter || /\r?\n/;
	return this.pipe(new SplitStream(delimiter));
};

/**
 * Batch objects into an array of size `batchSize`
 *
 * @method batch
 * @param {Integer} [batchSize=10]
 */
_Readable.prototype.batch = function(batchSize) {
	batchSize = parseInt(batchSize);
	batchSize = isNaN(batchSize) ? 10 : batchSize;
	return this.pipe(new BatchStream(batchSize));
};

/**
 * Pluck propterties from objects
 *
 * @method pluck
 * @param {String} [property='value'] - Property to pluck from the objects
 */
_Readable.prototype.pluck = function(property) {
	property = property || 'value';
	return this.pipe(new PluckStream(property));
};

/**
 * Intersperse seperator between chunks
 *
 * @method intersperse
 * @param {String} [seperator='\n'] - Seperator to push between chunks
 */
_Readable.prototype.intersperse = function(seperator) {
	seperator = (seperator === null || seperator === undefined) ? '\n' : seperator;
	return this.pipe(new IntersperseStream(seperator, { objectMode: this.isReadableObjectMode() }));
};

/**
 * Creates a writable stream that executes the given function for each
 * chunk or object, then pipes this stream into it.
 *
 * @method each
 * @param {Function} func - Function to execute for each chunk or object
 * @param {Object} func.chunk - Chunk or object passed to callback
 * @param {[String]} func.encoding - Encoding of chunk; this parameter is absent in object mode
 * @param {Function} func.cb - The callback passed to func
 * @param {Error} func.cb.error - Optional error to callback
 * @return {FunctionWritableStream} - The created Writable stream
 */
_Readable.prototype.each = function(func) {
	return this.pipe(new FunctionWritableStream(func, { objectMode: this.isReadableObjectMode() }));
};

/**
 * Skip over the specified number of objects/bytes.
 * If in object mode, objects will be skipped.
 * If in data mode, bytes will be skipped.
 *
 * @method skip
 * @param {Integer} n - Number of objects/bytes to skip
 */
_Readable.prototype.skip = function(n) {
	return this.pipe(new SkipStream(n, { objectMode: this.isReadableObjectMode() }));
};

/**
 * Limit the number of objects/bytes sent through the stream
 *
 * @method limit
 * @param {Integer} n - Number of objects/bytes read before the limit
 */
_Readable.prototype.limit = function(n) {
	return this.pipe(new LimitStream(n, { objectMode: this.isReadableObjectMode() }));
};

// Include these here to help with circular dependencies
var conversion = require('../conversion');
var ArrayWritableStream = require('../streams/array-writable-stream');
var BatchStream = require('../streams/batch-stream');
var FilterStream = require('../streams/filter-stream');
var PluckStream = require('../streams/pluck-stream');
var IntersperseStream = require('../streams/intersperse-stream');
var SplitStream = require('../streams/split-stream');
var StringWritableStream = require('../streams/string-writable-stream');
var ThroughStream = require('../streams/through-stream');
var FunctionWritableStream = require('../streams/function-writable-stream');
var SkipStream = require('../streams/skip-stream');
var LimitStream = require('../streams/limit-stream');
