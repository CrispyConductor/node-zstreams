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

	// Maintain zUpstreamStreams on pipe and unpipe
	this.on('pipe', function(source) {
		self._zUpstreamStreams.push(source);
	});

	this.on('unpipe', function(source) {
		self._zUpstreamStreams = self._zUpstreamStreams.filter(function(src) {
			return src !== source;
		});
	});
}

_Writable.prototype.getUpstreamStreams = function() {
	return this._zUpstreamStreams;
};

_Writable.prototype.isWritableObjectMode = function() {
	return !!this._writableState.objectMode;
};

_Writable.prototype.firstFinish = function(handler) {
	return this.once('finish', handler);
};

_Writable.prototype.firstUnignoredError = function(handler) {
	return this.once('unignorederror', handler);
};

_Writable.prototype.intoCallback = function(cb) {
	var calledCb = false;
	this.firstUnignoredError(function(error) {
		if(calledCb) return;
		calledCb = true;
		cb(error);
	});
	this.firstFinish(function() {
		if(calledCb) return;
		calledCb = true;
		cb();
	});
	return this;
};

module.exports = _Writable;
