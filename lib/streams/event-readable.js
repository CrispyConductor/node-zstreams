var Readable = require('../readable');
var inherits = require('util').inherits;

function EventReadable(emitter, eventTypes, options) {
	var self = this;
	if(!options) options = {};
	options.readableObjectMode = true;
	Readable.call(this, options);
	this._esEmitter = emitter;
	this._esEventBuffer = [];
	this._esCanPushMore = true;
	emitter.on('error', function(error) {
		self.emit('error', error);
	});
	emitter.on('end', function() {
		self.push(null);
	});
	eventTypes.forEach(function(eventType) {
		if(eventType !== 'error' && eventType !== 'end') {
			emitter.on(eventType, function() {
				self._esEventBuffer.push({
					type: eventType,
					args: Array.prototype.slice.call(arguments, 0)
				});
				if(self._esCanPushMore) {
					self._read();
				}
			});
			// support for crisphooks
			if(typeof emitter.hookAsync === 'function') {
				emitter.hookAsync(eventType, function(complete) {
					var eventObj = {
						type: eventType,
						args: Array.prototype.slice.call(arguments, 1),
						onflush: complete
					};
					self._esEventBuffer.push(eventObj);
					if(self._esCanPushMore) {
						self._read();
					}
				});
			}
		}
	});
}
inherits(EventReadable, Readable);

EventReadable.prototype._read = function() {
	var eventObj;
	var onflush;
	this._esCanPushMore = true;
	for(;;) {
		if(!this._esCanPushMore) {
			break;
		}
		if(this._esEventBuffer.length === 0) {
			break;
		}
		eventObj = this._esEventBuffer.shift();
		onflush = eventObj.onflush;
		delete eventObj.onflush;
		this._esCanPushMore = this.push(eventObj);
		if(onflush) {
			onflush();
		}
	}
};

module.exports = EventReadable;
