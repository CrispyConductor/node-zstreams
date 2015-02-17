
var StreamChain = require('../stream-chain');

// Assign a unique internal ID number to each instantiated stream
var streamIdCounter = 1;

/**
 * Writable mixins for ZStream streams.
 *
 * This class cannot be instantiated in itself.  Its prototype methods must be added to the prototype
 * of the class it's being mixed into, and its constructor must be called from the superclass's constructor.
 *
 * @class _Stream
 * @constructor
 * @param {Function} superObj - The prototype functions of the superclass the mixin is added on top of.  For example, Writable.prototype or Transform.prototype.
 */
function _Stream(superObj) {
	var self = this;
	this._zSuperObj = superObj;
	this._isZStream = true;
	this._ignoreStreamError = false;
	this._zStreamId = streamIdCounter++;
	this._currentStreamChain = new StreamChain(true);
	this._currentStreamChain._addStream(this);
	this._zStreamRank = 0;

	this.on('error', function(error) {
		// If there are no other 'error' handlers on this stream, trigger a chainerror
		if(self.listeners('error').length <= 1) {
			self.triggerChainError(error);
		}
	});
}
module.exports = _Stream;

_Stream.prototype.getStreamChain = function() {
	if(this._currentStreamChain.dirty) {
		this._recalculateStreamChain();
	}
	return this._currentStreamChain;
};

_Stream.prototype._recalculateStreamChain = function() {
	var chain = new StreamChain(false);
	this._propagateRecalculateStreamChain(chain);
	this._currentStreamChain._calculateStreamRanks();
};

_Stream.prototype._propagateRecalculateStreamChain = function(chain) {
	var self = this;
	if(chain._addStream(this)) {
		this._currentStreamChain = chain;
		if(typeof this.getUpstreamStreams === 'function') {
			this.getUpstreamStreams().forEach(function(stream) {
				if(typeof stream._propagateRecalculateStreamChain === 'function') {
					stream._propagateRecalculateStreamChain(chain);
				} else {
					// Most not be a zstream ... add it anyway
					chain._addStream(stream);
				}
			});
		}
		if(typeof this.getDownstreamStreams === 'function') {
			this.getDownstreamStreams().forEach(function(stream) {
				if(typeof stream._propagateRecalculateStreamChain === 'function') {
					stream._propagateRecalculateStreamChain(chain);
				} else {
					// Most not be a zstream ... add it anyway
					chain._addStream(stream);
				}
			});
		}
	}
};

/**
 * Cause a 'chainerror' event to be emitted across the whole chain.  This also has the following behavior:
 * 1. If there are no registered 'chainerror' handlers on any stream in the chain, and there are no registered
 * 'error' handlers on this stream (other than this stream's own internal error handler), the node default error
 * event handler (to bomb out) is used.
 * 2. If the ignoreError() function is not called during one of the chainerror event handlers, the abortChain()
 * method is called.
 *
 * @method triggerChainError
 * @param {Error} error - Chain error object
 * @return {Object} - Object containing fields 'handled' and 'ignored', for if the error had a handler assigned and if
 * the error was ignored by calling ignoreError() inside the event handler.
 */
_Stream.prototype.triggerChainError = function(error) {
	return this.getStreamChain().triggerChainError(error);
};

/**
 * Call this synchronously inside of a 'chainerror' event to suppress the default
 * behavior of aborting and destructing the stream chain.
 *
 * @method ignoreError
 */
_Stream.prototype.ignoreError = function() {
	this._ignoreStreamError = true;
};

/**
 * Trigger the abortChain() on the stream chain.
 *
 * @method abortChain
 */
_Stream.prototype.abortChain = function() {
	return this.getStreamChain().abortChain();
};

/**
 * Destroys and cleans up after this stream's internal resources.  Usually should not be called externally.
 *
 * @method abortStream
 * @private
 */
_Stream.prototype.abortStream = function() {
	this._abortStream();
	this.emit('abortstream');
};

/**
 * Override this method when subclassing a stream to clean up after internal resources.
 *
 * @method _abortStream
 */
_Stream.prototype._abortStream = function() {
};

/**
 * This is identical to calling .once('chainerror') except that the event handler isn't unregistered
 * after the first error such that it doesn't cause the node default error handler to activate.
 *
 * @method firstError
 * @param {Function} handler - The error handler function to be called once
 * @param {Object} handler.error - Error parameter to handler function
 * @return {Stream} this
 */
_Stream.prototype.firstError = function(handler) {
	var gotError = false;
	this.on('chainerror', function(error) {
		if(!gotError) {
			gotError = true;
			handler(error);
		}
	});
	return this;
};

_Stream.prototype.isReadable = function() {
	// Use duck typing here in case there are multiple stream implementations
	return !!this._read;
};

_Stream.prototype.isWritable = function() {
	// Use duck typing here in case there are multiple stream implementations
	return !!this._write;
};
