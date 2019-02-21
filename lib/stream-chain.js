var EventEmitter = require('events').EventEmitter;

/**
 * Tracks the streams that are components in a stream chain.
 *
 * @class StreamChain
 * @constructor
 * @param {Boolean} dirty - Whether or not the stream chain object needs recalculation
 */
function StreamChain(dirty) {
	this.streams = [];
	this.streamMap = {};
	this.dirty = dirty || false;
}
module.exports = StreamChain;

/**
 * Returns an array of streams in the chain.  This is correct and in order of rank only
 * if the stream chain is not dirty.
 */
StreamChain.prototype.getStreams = function() {
	return this.streams;
};

/**
 * Adds a stream to the stream chain.
 *
 * @method _addStream
 * @private
 * @param {ZStream} stream - The stream to add to the chain
 * @return {Boolean} - True if the stream was added to the collection; false if already in the collection
 */
StreamChain.prototype._addStream = function(stream) {
	if(stream._zStreamId) {
		if(this.streamMap[stream._zStreamId]) {
			return false;
		} else {
			this.streams.push(stream);
			this.streamMap[stream._zStreamId] = stream;
			return true;
		}
	} else {
		// Need to scan the whole list to determine membership
		if(this.streams.indexOf(stream) === -1) {
			this.streams.push(stream);
			return true;
		} else {
			return false;
		}
	}
};

/**
 * Calculate the _zStreamRank property on all streams in this chain.  The stream rank is
 * the "height" of the stream in the stream chain.  There's no minimum or maximum rank, and
 * the zero rank has no special significance.  They only serve to order streams in the chain.
 *
 * @method _calculateStreamRanks
 * @private
 */
StreamChain.prototype._calculateStreamRanks = function() {
	var i;
	// Set all stream ranks to null
	for(i = 0; i < this.streams.length; i++) {
		this.streams[i]._zStreamRank = null;
	}
	// Set a random stream's rank to 0
	this.streams[0]._zStreamRank = 0;
	// Cycle through all streams, deducing ranks as possible, until no more changes are made
	var madeChanges = true;
	var curStreamSet;
	var j;
	while(madeChanges) {
		madeChanges = false;
		for(i = 0; i < this.streams.length; i++) {
			if(this.streams[i]._zStreamRank === null) {
				if(typeof this.streams[i].getDownstreamStreams === 'function') {
					curStreamSet = this.streams[i].getDownstreamStreams();
					for(j = 0; j < curStreamSet.length; j++) {
						if(typeof curStreamSet[j]._zStreamRank === 'number') {
							this.streams[i]._zStreamRank = curStreamSet[j]._zStreamRank - 1;
							madeChanges = true;
						}
					}
				}
				if(typeof this.streams[i].getUpstreamStreams === 'function') {
					curStreamSet = this.streams[i].getUpstreamStreams();
					for(j = 0; j < curStreamSet.length; j++) {
						if(typeof curStreamSet[j]._zStreamRank === 'number') {
							this.streams[i]._zStreamRank = curStreamSet[j]._zStreamRank + 1;
							madeChanges = true;
						}
					}
				}
				if(!this.streams[i]._isZStream) {
					// If it's not a zstream, it's probably at the top of the chain, so assign a very low rank
					this.streams[i]._zStreamRank = -1000;
					madeChanges = true;
				}
			}
		}
	}
	// Sort streams by rank, low to high
	this.streams.sort(function(a, b) {
		if(typeof a._zStreamRank !== 'number' || typeof b._zStreamRank !== 'number') {
			return 0;
		}
		return a._zStreamRank - b._zStreamRank;
	});
};

/**
 * Cause a 'chainerror' event to be emitted across the whole chain.  This also has the following behavior:
 * 1. If there are no registered 'chainerror' handlers on any stream in the chain, the node default error
 * event handler (to bomb out) is used.
 * 2. If the ignoreError() function is not called during one of the chainerror event handlers, the abortChain()
 * method is called.
 *
 * @method triggerChainError
 * @param {Error} error - Chain error object
 * @return {Object} - Object containing fields 'handled' and 'ignored', for if the error had a handler assigned and if
 * the error was ignored by calling ignoreError() inside the event handler.
 */
StreamChain.prototype.triggerChainError = function(error) {
	var handled = false;
	var ignored = false;

	// Emit the chain error from the most upstream to most downstream stream
	var i;
	for(i = 0; i < this.streams.length; i++) {
		if(this.streams[i].listeners('chainerror').length) {
			handled = true;
		}
		this.streams[i].emit('chainerror', error);
		if(this.streams[i]._ignoreStreamError) {
			this.streams[i]._ignoreStreamError = false;
			ignored = true;
		}
	}

	// Abort the chain if the error was not ignored
	if(!ignored) {
		// Emit an unignored error event on every stream
		for(i = 0; i < this.streams.length; i++) {
			if(this.streams[i].listeners('unignorederror').length) {
				handled = true;
			}
			this.streams[i].emit('unignorederror', error);
		}

		this.abortChain();
	}
	if(!handled) {
		// Hack to emulate default node error event handler, 'cause we already have an error handler for this stream
		new EventEmitter().emit('error', error);
	}
	return {
		handled: handled,
		ignored: ignored
	};
};

/**
 * This method destroys a whole chain of streams.
 * This causes the following operations on streams in this chain:
 * 1. Unpipe all pipes in the stream.
 * 2. Redirect all readable streams to a blackhole stream.
 * 3. Register empty error handlers to suppress the node default error event handler.
 * 4. Call abortStream() on each stream that has the method.
 * 5. Call end() on all Writables in the chain.
 *
 * @method abortChain
 */
StreamChain.prototype.abortChain = function() {
	// Include this here to avoid circular dependency issues
	var BlackholeStream = require('./streams/blackhole-stream');
	var i;
	// Preserve list of streams so as pipes are adjusted the list stays the same
	var streams = this.streams.slice(0);

	// Unpipe the stream from the top down, and pipe to a blackhole stream, and register a blank error handler to suppress node default error behavior
	// Also call abortStream() on each stream
	for(i = 0; i < streams.length; i++) {
		if(typeof streams[i].unpipe === 'function') {
			streams[i].unpipe();
			if(streams[i]._readableState.objectMode) {
				streams[i].pipe(new BlackholeStream({ objectMode: true }));
			} else {
				streams[i].pipe(new BlackholeStream());
			}
		}
		streams[i].on('error', function() {});
		if(typeof streams[i].abortStream === 'function' && !streams[i]._zNoAbort) {
			streams[i].abortStream();
		}
	}

	// End all writables from the bottom up
	for(i = streams.length - 1; i >= 0; i--) {
		if(typeof streams[i].end === 'function' && !streams[i]._zNoAbort) {
			streams[i].end();
		}
	}
};
