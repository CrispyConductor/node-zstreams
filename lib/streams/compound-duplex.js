var Duplex = require('../duplex');
var inherits = require('util').inherits;

/**
 * Stream that allows encapsulating a set of streams piped together as a single stream.
 *
 * @class CompoundDuplex
 * @constructor
 * @param {Writable} writable - The first stream in the pipeline to encapsulate.  This is optional.  If all
 * streams in the pipeline are ZStreams, the readable alone can be used to determine the first stream in the pipeline.
 * @param {Readable} readable - The last stream in the pipeline.
 * @param {Object} options - Stream options.
 */
function CompoundDuplex(writable, readable, options) {
	var self = this;
	var convertToZStream = require('../index');	// for circular dependencies

	if(!readable && !options && (!writable || typeof writable.write !== 'function')) {
		options = writable;
		writable = new PassThrough();
		readable = new PassThrough();
	}

	if(!readable || typeof readable.read !== 'function') {
		options = readable;
		readable = writable;
		writable = null;
	}

	if(writable && !writable._isZStream) {
		writable = convertToZStream(writable);
	}
	if(!readable._isZStream) {
		readable = convertToZStream(readable);
	}

	if(!writable) {
		if(typeof readable.getStreamChain !== 'function') {
			throw new Error('Can only use shorthand CompoundDuplex constructor if pipeline is all zstreams');
		}
		writable = readable.getStreamChain().getStreams()[0];
	}

	if(!options) options = {};

	options.readableObjectMode = readable.isReadableObjectMode();
	options.writableObjectMode = writable.isWritableObjectMode();
	Duplex.call(this, options);
	
	this._compoundOptions = options;
	this._compoundReadable = readable;
	this._compoundWritable = writable;

	this._waitingForReadableData = false;

	writable.on('chainerror', function(error) {
		// Forward the error on; if the chain is to be destructed, the compound stream's _abortStream() method will be called
		this.ignoreError();
		self.emit('error', error);
	});

	readable.on('readable', function() {
		if(self._waitingForReadableData) {
			self._waitingForReadableData = false;
			self._readSomeData();
		}
	});

	readable.on('end', function() {
		self.push(null);
	});

	this.on('finish', function() {
		writable.end();
	});
}
inherits(CompoundDuplex, Duplex);

CompoundDuplex.prototype._readSomeData = function() {
	var chunk;
	for(;;) {
		chunk = this._compoundReadable.read();
		if(chunk === null) {
			this._waitingForReadableData = true;
			break;
		}
		if(!this.push(chunk)) {
			break;
		}
	}
};

CompoundDuplex.prototype._write = function(chunk, encoding, callback) {
	this._compoundWritable.write(chunk, encoding, function(error) {
		callback(error);
	});
};

CompoundDuplex.prototype._read = function() {
	this._readSomeData();
};

CompoundDuplex.prototype._abortStream = function() {
	if(typeof this._compoundWritable.abortChain === 'function') {
		this._compoundWritable.abortChain();
	}
	if(typeof this._compoundReadable.abortChain === 'function') {
		this._compoundReadable.abortChain();
	}
};

CompoundDuplex.prototype.wrap = function(stream) {
	var self = this;


	stream.on('error', function(error) {
		self.emit('error', error);
	});

	if(stream.destroy) {
		this._abortStream = function() {
			this._internalStream.destroy();
		};	
	}

	this._internalStream = stream;
	this.getInternalStream = function() {
		return this._internalStream;
	};

	if(!this._compoundWrapNoWritablePipe) {
		// Don't pipe this compound stream from the writable side
		this._compoundWritable.pipe(stream, { noConvert: true });
	}
	// Pipe Readable side through intermidiate stream, so we can act on the internal stream
	var wrapOutputPassThrough = this._wrapOutputPassThrough = new PassThrough(this._compoundOptions);
	wrapOutputPassThrough.pipe(this._compoundReadable);
	stream.pipe(wrapOutputPassThrough);
	
	return this;
};

module.exports = CompoundDuplex;

var PassThrough = require('../passthrough');
