/**
 * Classic mixins for wrapped "classic" streams.
 *
 * This class cannot be instantiated in itself.  Its prototype methods must be added to the prototype
 * of the class it's being mixed into, and its constructor must be called from the superclass's constructor.
 *
 * @class _Classic
 * @constructor
 */
function _Classic(stream) {
	this._isClassicZStream = true;
	this._internalStream = stream;
}
module.exports = _Classic;

_Classic.prototype.getInternalStream = function() {
	return this._internalStream;
};

_Classic.prototype._abortStream = function() {
	if(typeof this._internalStream.destroy === 'function') {
		this._internalStream.destroy();
	}
};
