var Writable = require('../writable');
var inherits = require('util').inherits;
var CrispHooks = require('crisphooks');

function EventWritable(options) {
	if(!options) options = {};
	options.writableObjectMode = true;
	Writable.call(this, options);
	CrispHooks.addHooks(this);
}
inherits(EventWritable, Writable);

EventWritable.prototype._write = function(eventObj, encoding, cb) {
	if(!eventObj.type || !eventObj.args) {
		return cb(new Error('EventWritable got object that is not an event object'));
	}
	this.emit.apply(this, [eventObj.type].concat(eventObj.args));
	this.trigger.apply(this, [eventObj.type].concat(eventObj.args).concat([function(error) {
		if(error) return cb(error);
		cb();
	}]));
};

module.exports = EventWritable;
