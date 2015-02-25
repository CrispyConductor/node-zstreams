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

	readable.on('finish', function() {
		self.emit('finish');
	});

	writable.once('prefinish', this._duplexPrefinish.bind(this));
	writable.once('finish', this._duplexPrefinish.bind(this));
}
inherits(CompoundDuplex, Duplex);

CompoundDuplex.prototype._duplexPrefinish = function() {
	if(this._duplexPrefinished) { return; }
	this._duplexPrefinished = true;

	// Try to run the flush function (if it exists)
	if(typeof this._flush === 'function') {
		var self = this;
		this._flush.call(this._compoundWritable, function(error) {
			self._duplexPrefinishDone(error);
		});
	} else {
		this._duplexPrefinishDone();
	}
};

CompoundDuplex.prototype._duplexPrefinishDone = function(error) {
	// Do some final cleanup after the flush function
	if(error) {
		this.emit('error', error);
	}

	this._compoundWritable.end();
};

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

module.exports = CompoundDuplex;
