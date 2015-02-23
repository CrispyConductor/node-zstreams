var expect = require('chai').expect;

var zstreams = require('../lib');
var EventReadable = zstreams.EventReadable;
var EventWritable = zstreams.EventWritable;
var EventTransform = zstreams.EventTransform;
var EventEmitter = require('events').EventEmitter;

describe('Event Streams', function() {

	it('should translate and forward events', function(done) {
		var emitter = new EventEmitter();
		var returnedVals = [];

		new EventReadable(emitter, [ 'testEvent1', 'testEvent2' ])
			.pipe(new EventTransform()
				.on('testEvent1', function(val) {
					this.pushEvent('testEvent3', val + 1);
				})
				.on('testEvent2', function(val) {
					this.pushEvent('testEvent4', val + 1);
				})
			).pipe(new EventWritable()
				.on('testEvent3', function(val) {
					returnedVals.push(val);
				})
				.on('testEvent4', function(val) {
					returnedVals.push(val);
				})
			).intoCallback(function(error) {
				expect(error).to.not.exist;
				expect(returnedVals).to.deep.equal([2, 3]);
				done();
			});

		emitter.emit('testEvent1', 1);
		setImmediate(function() {
			emitter.emit('testEvent2', 2);
			setImmediate(function() {
				emitter.emit('end');
			});
		});

	});

});
