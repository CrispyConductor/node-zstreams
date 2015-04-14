var Writable = require('../writable');
var inherits = require('util').inherits;
var CrispHooks = require('crisphooks');
var pasync = require('pasync');

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
	this.trigger.apply(this, [eventObj.type].concat(eventObj.args)).then(function() {
		cb();
	}, function(err) {
		cb(err);
	}).catch(pasync.abort);
};

module.exports = EventWritable;
