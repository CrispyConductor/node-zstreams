# zstreams

![Travis CI Status](https://travis-ci.org/crispy1989/node-zstreams.svg?branch=master)

A utility library to make node streams easier to work with, also including some utility streams.

## Documentation

[Basic Usage](#Basic-Usage)

### Types of Streams
* [Converting Native Streams](#Converting-Native-Streams)
* [Arrays as Streams](#arrays_as_streams)
* [Easy Transforms](#easy_transforms)
* [Through Methods](#)
* [HTTP Requests](#HTTP Requests)
* [Stream Destruction and Cleanup](#)
* [Error Handling](#)
* [Event Streams](#)
* [Other Useful Functions](#)
* [Simplified Constructors](#)
* [Utility Streams](#)
* [ArrayReabableStream](#)
* [ArrayWritableStreams](#)
* [BatchStream](#)
* [BlackholeStream](#)
* [CompoundDuplex](#)
* [ConsoleLogStream](#)
* [EventReadableStream](#)
* [EventWritableStream](#)
* [EventTransformStream](#)
* [FilterStream](#)
* [SkipStream](#)
* [LimitStream](#)
* [FunctionStream](#) needs to be added to readme
* [IntersperseStream](#) needs to be added to readme
* [PluckStream](#) needs to be added to readme
* [RequestStream](#) needs to be added to readme
* [SplitStream](#) needs to be added to readme
* [StringReadableStream](#) needs to be added to readme
* [StringWritableStream](#) needs to be added to readme
* [ThroughStream](#) needs to be added to readme
* [ClassicReadable](#)
* [ClassicWritable](#)
* [ClassicDuplex](#classicDuplex)

<a name="basic_usage"/>
## Basic Usage

### Requiring Object

````javascript
var zstreams = require('zstreams');
var Writable = zstreams.Writable,
	Readable = zstreams.Readable,
	Duplex = zstreams.Duplex,
	Transform = zstreams.Transform,
	PassThrough = zstreams.PassThrough;
````

The base zstreams function like, and inherit from, the native Node.JS streams.  They mostly behave like their
parents, with

<a name="converting_native_streams"/>
### Converting Native Streams

````javascript
var fs = require('fs');
var readStream = zstreams(fs.createReadStream('./file.txt'));
// Also equivalent to:
var readStream = zstreams.fromFile('./file.txt');
````

Note that if you use `Readable.pipe()` on a zstream, it will automatically convert the destination to a zstream, so you
only need to explicitly convert the first stream in a chain.

<a name="arrays_as_streams"/>
### Treat Arrays as Streams
````javascript
var array = [1, 2, 3, 4, 5];
new zstreams.ArrayReadableStream(array).pipe(new zstreams.ConsoleLogStream());
zstreams.fromArray(array).pipe(new zstreams.ConsoleLogStream());
new zstreams.ArrayReadableStream(array).pipe(something).pipe(somethingelse).toArray(function(error, resultArray) {

});
````

The `toArray()` method takes a callback that is called once, either on first error in the stream chain or with the result array.

<a name="easy_transforms"/>
### Easy Transforms

````javascript
zstreams(fs.createReadStream('./test.txt')).throughSync(function(chunk) {
	return chunk.toString('utf8').toUpperCase();
}).pipe(fs.createWriteStream('./uppercase.txt'));
// Instead of .pipe(...) you can also do .intoFile('./uppercase.txt')
````

<a name="through_methods"/>
A set of `through` methods are available on readables to easily transform data.  They create a Transform stream, use the supplied
function to transform the data, pipe to the Transform stream, and return the Transform stream.  The created Transform implicitly has
its writableObjectMode set to the source stream's readableObjectMode, and the Transform's readableObjectMode depends on the variant
of call used.

````javascript
// Data to Data, Synchronous
readable.throughSync(function(chunk, encoding) {
		//...
		return resultData;
});

// Object to Object, Synchronous
readable.throughSync(function(object) {
	//...
	return resultObject;
});

// Data to Object, Synchronous
readable.throughObjSync(function(chunk, encoding) {
	//...
	return resultObject;
});

// Object to Data, Synchronous
readable.throughDataSync(function(object) {
		//...
		return resultData;
});

// Data to Data, Asynchronous
readable.through(function(chunk, encoding, cb) {
		//...
		cb(null, resultData);
});

// Object to Object, Asynchronous
readable.through(function(object, cb) {
	//...
	cb(null, resultObject);
});

// Data to Object, Asynchronous
readable.throughObj(function(chunk, encoding, cb) {
	//...
	cb(null, resultObject);
});

// Object to Data, Asynchronous
readable.throughDataSync(function(object, cb) {
		//...
		cb(null, resultData);
});
````

The synchronous variants can also throw exceptions, which are converted to stream errors.

<a name="http_requests"/>
### HTTP Requests

If you install the optional dependency `request` via `npm install request`, you can use the zstreams request extensions.  These
extensions provide the following benefits:
* An actual streams2 interface
* Treating certain HTTP codes as errors
* Automatically reading in the response body on error instead of streaming it as if it were a legitimate response
* All the other benefits of a zstreams stream

A zstreams `RequestStream` is a Duplex stream and can be piped from or to (in the case of sending a body to the server).

````javascript
zstreams.request('http://www.google.com').intoFile('/tmp/output.html', function(error) {
	// If any status code other than 200 was returned, the error will be thrown.  Additionally, the
	// entire response body for the error response will be available as error.responseBody .
});

// Or pass your request directly into zstreams to automatically convert
zstreams(request('http://www.google.com')).intoFile('/tmp/output.html', function(error) {
	// ...
});

// You can also override the default options
zstreams.request({
	url: 'http://www.google.com',
	allowedStatusCodes: [200],	// treat 200 as the only valid response code
	readErrorResponse: false	// disable reading the whole response body on error
}).intoFile('/tmp/output.html', function(error) {
	// ...
});
````

<a name="destruction_and_cleanup"/>
### Stream Destruction and Cleanup

When zstreams wants a stream to stop in its tracks and abort, it will call the `_abortStream()` method.  Implement this to
do any cleanup necessary to stop current operations, such as closing file handles and whatnot.

<a name="error_handling"/>
### Error Handling

When an `error` event is emitted from any zstreams, the stream will emit a `chainerror` event on itself as well as all
streams connected to it via pipes.  This allows for error handling in one spot, like:

````javascript
zstreams(fs.createReadStream('./test.txt')).throughSync(function(chunk) {
	return chunk.toString('utf8').toUpperCase();
}).pipe(fs.createWriteStream('./uppercase.txt')).on('chainerror', function(error) {
	// Handle error
});
````

If you manually assign an `error` event handler to a stream in the chain, errors on that stream will *not* cause `chainerror`
events to be emitted, and will bypass zstreams' error handling.  Additionally, if a `chainerror` event is fired, and there are
no handlers registered for it in the entire stream chain, zstreams will emulate the Node.JS default `error` event behavior
and exit.

By default, after the `chainerror` event is fired, the `abortChain()` method is called, which unpipes everything in the chain,
repipes all Readables to blackhole streams, and calls `_abortStream()` on each stream.  If you want to recover from an error, you
must call `this.ignoreError()` inside of the `chainerror` handler.  This will suppress that error behavior.

If you are making use of conditionally ignored errors, you may also want to make use of the 'unignorederror' event.  This event
is emitted on every stream in a chain immediately before the chain is destructed on unignored error.

The following options are also available for error handling:

````javascript
// Equivalent to stream.once('chainerror', ...), except that the event handler is not unregistered after the handler
// is called the first time (it just becomes a no-op).  This prevents the application from crashing if there is more
// than one stream error.
stream.firstError(function(error) {
	...
});

// This similar function is only available on Writable streams.  The given callback is called either on error or when the
// Writable emits `finish`.  In either case, it is guaranteed to be only called once.
writable.intoCallback(function(error) {

});
````

<a name="event_streams"/>
## Event Streams

zstreams contains a few streams that operate on events pass through the stream.  Internally, events are just converted into
objects and passed through an object stream.  These event streams are useful because they present an EventEmitter and crisphooks
interface.

If you need to access the stream as a plain object stream, you can use the event objects passed along.  They follow this format:
````javascript
{
	"type": "Event Type",
	"args": ["Argument 1", "Argument 2"]
}
````

Here's a basic example:
````javascript
var emitter = new EventEmitter();

// Construct an EventReadable stream that listens for events testEvent1 and testEvent2 on emitter
// and translates them into stream objects
new EventReadable(emitter, [ 'testEvent1', 'testEvent2' ])
	// Pipe that through an event transform that emits some other events in response to the first events
	.pipe(new EventTransform()
		.on('testEvent1', function(val) {
			this.pushEvent('testEvent3', val + 1);
		})
		.on('testEvent2', function(val) {
			this.pushEvent('testEvent4', val + 1);
		})
	// Pipe that into an event writable to do something with the events
	).pipe(new EventWritable()
		.on('testEvent3', function(val) {
			// Do something with testEvent3
		})
		.on('testEvent4', function(val) {
			// Do something with testEvent4
		})
	).intoCallback(function(error) {
		// Stream finished
	});

	emitter.emit('testEvent1', 1);
	emitter.emit('testEvent2', 2);
	emitter.emit('end');

});
````

<a name="other_useful_functions"/>
## Other Useful Functions

````javascript
// List streams piping to this stream
writable.getUpstreamStreams();

// Check whether or not this stream accepts object
writable.isWritableObjectMode();

// Similar to .firstError() but called on the first 'finish' event
writable.firstFinish(function() { ... });

// .tee() is like .pipe(), except that .tee() returns the first stream (in this case, 'readable') rather than the
// stream being piped to
readable.tee(writable).pipe(otherwritable);

readable.getDownstreamStreams();

readable.isReadableObjectMode();

// Causes the chainerror behavior to be enacted with the given error
stream.triggerChainError(error);

// Causes the whole chain to be aborted according to the behavior described in error handling above
stream.abortChain();

// Causes this stream's _abortStream() method to be called
stream.abortStream();

// Returns true if the stream can be read from
stream.isReadable();

// Returns true if the stream can be written to
stream.isWritable();
````

<a name="simplified_constructors"/>
### Simplified Constructors

Zstreams supports iojs simplified stream constructors as seen [here](https://iojs.org/api/stream.html#stream_simplified_constructor_api).

````javascript
var writeStream = new Writable({
	objectMode: true,
	write: function(chunk, encoding, cb) {
		cb();
	},
	flush: function(cb) {
		cb();
	}
});

var duplexStream = new Duplex({
	write: function(chunk, encoding, cb) {
		cb();
	},
	read: function() {

	},
	flush: function(cb) {
		cb();
	}
});
````

<a name="utility_streams"/>
## Utility Streams

zstreams also provides several utility streams on the zstreams object which may come in handy.

<a name="arrayReadable"/>
### ArrayReadableStream

This is a readable object stream which will stream the object in an array.  It is the stream used by `zstreams.fromArray()`.

````javascript
var arrayReadableStream = new zstreams.ArrayReadableStream([1, 2, 3, 4]);
arrayReadableStream.pipe(...);
````

<a name="arrayWritable"/>
### ArrayWritableStream

This is a writable object stream which will store all objects it receives into an array.

````javascript
var arrayReadableStream = new zstreams.ArrayReadableStream([1, 2, 3, 4]);
var arrayWritableStream = new zstreams.ArrayWritableStream();
arrayReadableStream.pipe(arrayWritableStream).intoCallback(function() {
	var array = arrayWritableStream.getArray();
});
````

<a name="batchStream"/>
### BatchStream

This stream receives a stream of objects and generates a stream of arrays of batches of these objects.  Its
constructor takes a parameter of the size of each batch.

````javascript
zstreams
	.fromArray([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
	.pipe(new zstreams.BatchStream(3))
	.intoArray(function(error, array) {
		// array is: [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]]
	});
````

<a name="blackhole"/>
### BlackholeStream

Anything piped into this stream is discarded.

<a name="compoundDuplex"/>
### CompoundDuplexStream

This stream allows you to construct a stream from a set of component streams piped together, acting as a single stream.
The readableObjectMode and writableObjectMode of the CompoundDuplex stream are automatically determined.

````javascript
function NewlineSeparatedJSONParser() {
	zstreams.CompoundDuplex.call(this,
		new SplitStream(/\r?\n/)
		.throughSync(function(chunk) {
			return JSON.parse(chunk);
		})
		.filterSync(function(obj) {
			return obj !== null;
		})
	);
}
util.inherits(NewlineSeparatedJSONParser, zstreams.CompoundDuplex);

zstream.fromFile('newlineJsonStream.txt').pipe(new NewlineSeparatedJSONParser()).intoArray(function(error, array) {
	// ...
});
````

<a name="consoleLog"/>
### ConsoleLogStream

Anything piped to this Writable will be logged out using console.log().  Takes the same parameters as Writable,
notably the `objectMode` option should be set if it's logging objects.

````javascript
zstreams(fs.createReadStream('in.txt')).tee(new zstreams.ConsoleLogStream()).pipe(fs.createWriteStream('out.txt'));
````

<a name="eventReadable"/>
### EventReadable

Given an EventEmitter, creates objects for each event.

<a name="eventWritable"/>
### EventWritable

Given a stream of event objects, emits events/crisphooks for each event object.

<a name="eventTransform"/>
### EventTransform

Transforms input events and outputs more events.

<a name="filterStream"/>
### FilterStream

The asynchronous streaming equivalent of `Array.prototype.filter()`.

````javascript
zstreams.fromArray([1, 2, 3]).pipe(new zstreams.FilterStream(function(obj, cb) {
	return obj >= 2;
})).intoArray(function(error, array) {
	// array is [2, 3]
});
````

<a name="skipStream"/>
### SkipStream

Skip over objects/bytes from a Readable stream

```javascript
zstreams.fromArray([1, 2, 3, 4])
	.pipe(new zstreams.SkipStream(2, { objectMode: true })
	.intoArray(function(error, array) {
		// array is [3, 4]
	});
```

<a name="limitStream"/>
### LimitStream

Limit objects/bytes from a Readable stream

```javascript
zstreams.fromArray([1, 2, 3, 4])
	.pipe(new zstreams.LimitStream(2, { objectMode: true })
	.intoArray(function(error, array) {
		// array is [1, 2]
	});
```

<a name="classicReadable"/>
### ClassicReadable

Wrap a classic "readable" (Streams1) stream

```javascript
new zstreams.ClassicReadable(readable, { objectMode: true }).intoArray(function(error, array) {
	// Do something with the array
});
```

<a name="classicWritable"/>
### ClassicWritable

Wrap a classic "writable" (Streams1) stream

```javascript
zstreams.fromArrray([1, 2, 3, 4]).pipe(new ClassicWritable(writable, { objectMode: true })).intoCallback(function(error) {
	// Do something
});
```

<a name="classicDuplex"/>
### ClassicDuplex

Wrap a classic "duplex" (Streams1) stream

```javascript
zstreams.fromArray([1, 2, 3, 4]).pipe(new ClassicDuplex(duplex, { objectMode: true })).intoArray(function(error, array) {
	// array is [1, 2, 3, 4]
});
```
