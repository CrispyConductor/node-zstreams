/* jshint ignore:start */
var Promise = Promise || require('es6-promise').Promise;
/* jshint ignore:end */

/**
 * Writable mixins for ZWritable streams.
 *
 * This class cannot be instantiated in itself.  Its prototype methods must be added to the prototype
 * of the class it's being mixed into, and its constructor must be called from the superclass's constructor.
 *
 * @class _Writable
 * @constructor
 */
function _Writable() {
	var self = this;
	this._zUpstreamStreams = [];
	this._writableState.zEnded = false;
	this._writableState.zError;

	// Maintain zUpstreamStreams on pipe and unpipe
	this.on('pipe', function(source) {
		self._zUpstreamStreams.push(source);
	});

	this.on('unpipe', function(source) {
		self._zUpstreamStreams = self._zUpstreamStreams.filter(function(src) {
			return src !== source;
		});
	});

	self.firstFinish(function() {
		self._writableState.zEnded = true;
	});

	self.firstUnignoredError(function(error) {
		self._writableState.zError = error;
	});
}

_Writable.prototype.getUpstreamStreams = function() {
	return this._zUpstreamStreams;
};

_Writable.prototype.isWritableObjectMode = function() {
	return !!this._writableState.objectMode;
};

_Writable.prototype.firstFinish = function(handler, ignoreCloseAsFinish) {
	var calledHandler = false;
	function handleEvent() {
		if(!calledHandler) {
			calledHandler = true;
			handler.call(this);
		}
	}
	this.once('finish', handleEvent);
	if(!ignoreCloseAsFinish) {
		// Some streams (notably levelup streams) seem to emit 'close' instead of
		// (not in addition to) 'finish'
		this.once('close', handleEvent);
	}

	if(this._writableState.zEnded) {
		handleEvent();
	}
};

_Writable.prototype.firstUnignoredError = function(handler) {
	var calledHandler = false;
	function handleEvent(error) {
		if(!calledHandler) {
			calledHandler = true;
			handler.call(this, error);
		}
	}

	this.once('unignorederror', handleEvent);

	if(this._writableState.zError) {
		handleEvent(this._writableState.zError);
	}
};

_Writable.prototype.intoCallback = function(cb) {
	if(this._writableState.zError) {
		cb.call(this, this._writableState.zError);
	} else {
		var calledCb = false;
		this.firstUnignoredError(function(error) {
			if(calledCb) return;
			calledCb = true;
			cb.call(this, error);
		});
		this.firstFinish(function() {
			if(calledCb) return;
			calledCb = true;
			cb.call(this);
		});
	}
	return this;
};

_Writable.prototype.intoPromise = function() {
	var self = this;
	return new Promise(function(resolve, reject) {
		self.intoCallback(function(error) {
			if(error) {
				return reject(error);
			}
			resolve();
		});
	});
};

module.exports = _Writable;
