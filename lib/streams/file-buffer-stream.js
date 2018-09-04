var inherits = require('util').inherits;
var Duplex = require('../duplex');
var fs = require('fs');

/**
 * Passthrough stream that buffers an unlimited amount of data to a file.  This is useful
 * in cases where a slow stream destination could cause a faster source (such as an http
 * request) to time out.
 *
 * The shell analogy for this is to cat to a file, and tail -f that file elsewhere.
 *
 * @class FileBufferStream
 * @constructor
 * @param {Object} [options]
 * @param {String} options.filename - The filename to buffer to.  Defaults to a file in /tmp .
 * @param {Boolean} options.removeFile - If set to false, the buffer file will not be deleted
 *   when the stream is finished.  Defaults to true.
 */
function FileBufferStream(options) {
	if (!options) options = {};

	// Always data mode
	options.objectMode = false;
	options.allowHalfOpen = true;

	Duplex.call(this, options);
	this._fileBufferState = {
		writeFd: null,				// FD writing to the file
		waitingForWriteOpen: null,	// Function to call when the writing open() returns
		readFd: null,				// FD reading from the file
		waitingForRead: false,		// True if push() returned false and we're waiting for _read() to be called again
		readBufferSize: 16 * 1024,	// Size of file read buffer
		totalWritten: 0,
		totalRead: 0,
		writeEof: false, 			// If the writable side of this stream has EOF'd
		options: options
	};
	var self = this;

	// Generate a temp filename if not given
	if (!options.filename) {
		options.filename = '/tmp/zstreams-' + Math.floor(Math.random() * 10000) + Math.floor(Math.random() * 10000);
	}

	// Default to removing temp file
	if (options.removeFile === undefined) {
		options.removeFile = true;
	}

	// Open the file for writing
	fs.open(options.filename, 'w', function(err, fd) {
		if (err) return self.emit(err);
		self._fileBufferState.writeFd = fd;
		if (self._fileBufferState.waitingForWriteOpen) {
			self._fileBufferState.waitingForWriteOpen();
			self._fileBufferState.waitingForWriteOpen = null;
		}
	});
}
inherits(FileBufferStream, Duplex);

FileBufferStream.prototype._read = function(size) {
	this._fileBufferState.waitingForRead = false;
	this._checkReadMore(size);
};

function writeAll(fd, buffer, length, cb) {
	function writeSome(off) {
		if (off >= length) return cb(null, length, buffer);
		var lenToWrite = length - off;
		fs.write(fd, buffer, off, lenToWrite, null, function(err, bytesWritten) {
			if (err) return cb(err);
			writeSome(off + bytesWritten);
		});
	}
	writeSome(0);
}

FileBufferStream.prototype._write = function(chunk, encoding, cb) {
	var self = this;
	if (this._fileBufferState.writeFd === null) {
		if (this._fileBufferState.waitingForWriteOpen) {
			throw new Error('Unexpected parallel writes');
		}
		this._fileBufferState.waitingForWriteOpen = doWrite;
	} else {
		doWrite();
	}

	function doWrite() {
		if(self._fileBufferState.fileWriting) {
			throw new Error('Unexpected parallel writes');
		}
		self._fileBufferState.fileWriting = true;
		writeAll(self._fileBufferState.writeFd, chunk, chunk.length, function(err) {
			self._fileBufferState.fileWriting = false;
			if (err) return self.emit('error', err);
			self._fileBufferState.totalWritten += chunk.length;
			// If we're not waiting for read() to be called again, trigger it
			if (!self._fileBufferState.waitingForRead) {
				self._read();
			}
			cb();
		});
	}
};

FileBufferStream.prototype._flush = function(cb) {
	this._fileBufferState.writeEof = true;
	if (!this._fileBufferState.waitingForRead) {
		this._read();
	}
	cb();
};

FileBufferStream.prototype._checkReadMore = function(size) {
	var self = this;
	// Check if more data has been written that we've read
	if (this._fileBufferState.totalWritten > this._fileBufferState.totalRead) {
		// There's more to read
		if (typeof this._fileBufferState.readFd === 'number') {
			// The FD is already open
			this._readMoreData(size);
		} else {
			// We need to open a new reading FD and read the additional data
			if (this._fileBufferState.openingRead) return;
			this._fileBufferState.openingRead = true;
			fs.open(this._fileBufferState.options.filename, 'r', function(err, fd) {
				self._fileBufferState.openingRead = false;
				if (err) return self.emit('error', err);
				if (self._fileBufferState.readFd) {
					throw new Error('Unexpected parallel open read file');
				}
				self._fileBufferState.readFd = fd;
				self._readMoreData(size);
			});
		}
	} else if (this._fileBufferState.writeEof) {
		// We've read everything there is to be read, and we've EOF'd
		this.push(null);
		this._cleanup();
	}
};

FileBufferStream.prototype._readMoreData = function(wantedSize) {
	var self = this;
	var size = wantedSize;
	if (!this._fileBufferState.readFd) {
		throw new Error('No readFd when in _readMoreData()');
	}
	if (this._fileBufferState.fileReading) {
		return;
	}
	this._fileBufferState.fileReading = true;
	if (!size || size > this._fileBufferState.readBufferSize) {
		size = this._fileBufferState.readBufferSize;
	}
	var readBuffer = new Buffer(size);
	var seekPosition = this._fileBufferState.totalRead;
	fs.read(this._fileBufferState.readFd, readBuffer, 0, size, seekPosition, function(err, bytesRead, readBuffer) {
		self._fileBufferState.fileReading = false;
		if (err) return self.emit(err);
		if (bytesRead < 1) {
			// EOF; no more data to read for now
			if (self._fileBufferState.readFd) {
				fs.close(self._fileBufferState.readFd, function() {});
				self._fileBufferState.readFd = null;
			}
			if (self._fileBufferState.totalRead >= self._fileBufferState.totalWritten && self._fileBufferState.writeEof) {
				// Read everything
				self.push(null);
				self._cleanup();
			} else if (self._fileBufferState.totalRead < self._fileBufferState.totalWritten) {
				// We got an EOF but we've written more than we've read ?
				throw new Error('Unexpected EOF reading buffer file');
			}
		} else {
			self._fileBufferState.totalRead += bytesRead;
			var pushMore = self.push(readBuffer.slice(0, bytesRead));
			if (pushMore) {
				self._readMoreData((!wantedSize || bytesRead >= wantedSize) ? null : (wantedSize - bytesRead));
			} else {
				self._fileBufferState.waitingForRead = true;
			}
		}
	});
};

FileBufferStream.prototype._cleanup = function() {
	if (this._fileBufferState.options.removeFile) {
		fs.unlink(this._fileBufferState.options.filename, function() {});
	}
	if (this._fileBufferState.readFd) {
		fs.close(this._fileBufferState.readFd, function() {});
		this._fileBufferState.readFd = null;
	}
	if (this._fileBufferState.writeFd) {
		fs.close(this._fileBufferState.writeFd, function() {});
		this._fileBufferState.writeFd = null;
	}
};

FileBufferStream.prototype._destroy = function(err, cb) {
	this._cleanup();
	Duplex.prototype._destroy.call(this, err, cb);
};

FileBufferStream.prototype.getFilename = function() {
	return this._fileBufferState.options.filename;
};

module.exports = FileBufferStream;
