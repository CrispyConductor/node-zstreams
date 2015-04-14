var Transform = require('../transform');
var inherits = require('util').inherits;
var CrispHooks = require('crisphooks');
var pasync = require('pasync');

function EventTransform(options) {
	if(!options) options = {};
	options.objectMode = true;
	Transform.call(this, options);
	CrispHooks.addHooks(this);
}
inherits(EventTransform, Transform);

EventTransform.prototype._transform = function(eventObj, encoding, cb) {
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

EventTransform.prototype.pushEvent = function(eventType/* ,args*/) {
	this.push({
		type: eventType,
		args: Array.prototype.slice.call(arguments, 1)
	});
};

module.exports = EventTransform;
