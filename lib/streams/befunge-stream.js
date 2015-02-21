var Duplex = require('../duplex');
var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;

// Implements a Befunge stack
// The stack can contain either numbers or single character strings
// A char is converted into a number by its ascii char code
// A number is converted into a char by the reverse process
function BefungeStack(stack) {
	this.stack = stack ? stack.slice(0) : [];
}

BefungeStack.prototype.push = function(val) {
	this.stack.push(val);
}

BefungeStack.prototype.pop = function() {
	if(!this.stack.length) return 0;
	return this.stack.pop();
};

BefungeStack.prototype.popAsNumber = function() {
	var val = this.pop();
	if(typeof val !== 'number') {
		return val.charCodeAt(0);
	} else {
		return val;
	}
};

BefungeStack.prototype.popAsChar = function() {
	var val = this.pop();
	if(typeof val !== 'string') {
		return String.fromCharCode(val);
	} else {
		return val;
	}
};

BefungeStack.prototype.clear = function() {
	this.stack = [];
};

BefungeStack.prototype.transferFrom = function(otherStack, n) {
	var i;
	if(n > 0) {
		var elementsToTransfer = otherStack.stack.slice(-n);
		if(elementsToTransfer.length < n) {
			for(i = 0; i < n - elementsToTransfer.length; i++) {
				this.stack.push(0);
			}
		}
		if(elementsToTransfer.length) {
			Array.prototype.push.apply(this.stack, elementsToTransfer);
		}
		for(i = 0; i < elementsToTransfer.length; i++) {
			otherStack.stack.pop();
		}
	} else if(n < 0) {
		for(i = 0; i < -n; i++) {
			this.stack.push(0);
		}
	}
};

BefungeStack.prototype.transferFromPushPop = function(otherStack, n) {
	if(n < 0) n = -n;
	for(var i = 0; i < n; i++) {
		this.push(otherStack.pop());
	}
};

// This implements 2-dimensional funge space.
// initialValues can be one of:
// - A string with newline-separated rows
// - An array of strings, one string per row
// - An array of arrays of cells
function BefungeSpace(initialValues) {
	var self = this;
	// Array of arrays of cells/values
	this.quad1 = [];	// +x +y
	this.quad2 = [];	// -x +y
	this.quad3 = [];	// -x -y
	this.quad4 = [];	// +x -y
	if(Array.isArray(initialValues) && Array.isArray(initialValues[0])) {
		this.quad1 = initialValues;
	}
	if(Array.isArray(initialValues) && typeof initialValues[0] === 'string') {
		initialValues.forEach(function(row, y) {
			for(var i = 0; i < row.length; i++) {
				self.set(i, y, row[i]);
			}
		});
	}
	if(typeof initialValues === 'string') {
		initialValues.split(/\r?\n/).forEach(function(row, y) {
			row.forEach(function(cell, x) {
				self.set(x, y, cell);
			});
		});
	}
}

BefungeSpace.prototype.getQuad = function(x, y) {
	if(x >= 0 && y >= 0) return this.quad1;
	else if(x < 0 && y >= 0) return this.quad2;
	else if(x < 0 && y < 0) return this.quad3;
	else return this.quad4;
};

BefungeSpace.prototype.getQuadCoords = function(x, y) {
	if(x >= 0 && y >= 0) return [this.quad1, x, y];
	else if(x < 0 && y >= 0) return [this.quad2, 0 - x + 1, y];
	else if(x < 0 && y < 0) return [this.quad3, 0 - x + 1, 0 - y + 1];
	else return [this.quad4, x, 0 - y + 1];
};

BefungeSpace.prototype.set = function(x, y, val) {
	var qcoords = this.getQuadCoords(x, y);
	var quad = qcoords[0];
	x = qcoords[1];
	y = qcoords[2];
	while(quad.length <= y) quad.push([]);
	while(quad[y].length <= x) quad[y].push(' ');
	quad[y][x] = val;
};

BefungeSpace.prototype.get = function(x, y) {
	var qcoords = this.getQuadCoords(x, y);
	var quad = qcoords[0];
	x = qcoords[1];
	y = qcoords[2];
	if(quad.length <= y) return undefined;
	if(quad[y].length <= x) return undefined;
	var val = quad[y][x];
	if(val === undefined) return null;
	return val;
};

BefungeSpace.prototype.getAsNumber = function(x, y) {
	var val = this.get(x, y);
	if(val === undefined || val === null) return 32;
	if(typeof val !== 'number') {
		return val.charCodeAt(0);
	} else {
		return val;
	}
};

BefungeSpace.prototype.getAsChar = function(x, y) {
	var val = this.get(x, y);
	if(val === undefined || val === null) return ' ';
	if(typeof val !== 'string') {
		return String.fromCharCode(val);
	} else {
		return val;
	}
};

var ipIdCtr = 1;

// arg can either be space or another IP
function BefungeIP(space) {
	this.ipId = ipIdCtr++;
	if(space && space.x && space.dx) {
		var other = space;
		this.dx = other.dx;
		this.dy = other.dy;
		this.x = other.x;
		this.y = other.y;
		this.offsetX = other.offsetX;
		this.offsetY = other.offsetY;
		this.stringMode = other.stringMode;
		this.stopped = other.stopped;
		this.space = other.space;
		this.firstTick = other.firstTick;
		this.stackStack = other.stackStack.map(function(stack) {
			return new BefungeStack(stack);
		});
	} else {
		this.dx = 1;
		this.dy = 0;
		// x and y are absolute and not relative to an offset
		this.x = 0;
		this.y = 0;
		this.offsetX = 0;
		this.offsetY = 0;
		this.stringMode = false;
		this.stopped = false;
		// Index 0 is top of the stack here
		this.stackStack = [new BefungeStack()];
		this.space = space;
		this.firstTick = true;
	}
}

BefungeIP.prototype.curStack = function() {
	return this.stackStack[0];
};

BefungeIP.prototype.setDirection = function(dx, dy) {
	if(dy === undefined) {
		// Treat dx as a direction, 0=north,1=east,2=south,3=west
		while(dx > 3) dx -= 4;
		while(dx < 0) dx += 4;
		switch(dx) {
			case 0:
				this.dx = 0;
				this.dy = -1;
				break;
			case 1:
				this.dx = 1;
				this.dy = 0;
				break;
			case 2:
				this.dx = 0;
				this.dy = 1;
				break;
			case 3:
				this.dx = -1;
				this.dy = 0;
				break;
			default:
				break;
		}
	} else {
		this.dx = dx;
		this.dy = dy;
	}
};

BefungeIP.prototype.getDirectionId = function() {
	if(this.dx === 0 && this.dy === -1) return 0;
	if(this.dx === 1 && this.dy === 0) return 1;
	if(this.dx === 0 && this.dy === 1) return 2;
	if(this.dx === -1 && this.dy === 0) return 3;
	return 0;
};

BefungeIP.prototype.setPosition = function(x, y) {
	this.x = x;
	this.y = y;
};

BefungeIP.prototype.advance = function(count) {
	if(count !== undefined && count > 1) {
		for(var ctr = 0; ctr < count; ctr++) {
			this.advance();
		}
		return;
	}
	var dx = this.dx;
	var dy = this.dy;
	while(dx > 0) {
		dx--;
		this.x++;
		if(this.space.get(this.x, this.y) === undefined) {
			this.x = 0 - this.space.getQuad(-1, this.y).length;
		}
	}
	while(dx < 0) {
		dx++;
		this.x--;
		if(this.space.get(this.x, this.y) === undefined) {
			this.x = this.space.getQuad(1, this.y).length - 1;
		}
	}
	var minY1 = 0 - this.space.getQuad(1, -1).length;
	var minY2 = 0 - this.space.getQuad(-1, -1).length;
	var minY = minY1 < minY2 ? minY1 : minY2;
	var maxY1 = this.space.getQuad(1, 1).length - 1;
	var maxY2 = this.space.getQuad(-1, 1).length - 1;
	var maxY = maxY1 > maxY2 ? maxY1 : maxY2;
	while(dy > 0) {
		dy--;
		this.y++;
		if(this.y > maxY) this.y = minY;
	}
	while(dy < 0) {
		dy++;
		this.y--;
		if(this.y < minY) this.y = maxY;
	}

};

BefungeIP.prototype.advanceOver = function() {
	this.advance();
	return this.advanceUntil();
};

BefungeIP.prototype.advanceUntil = function(ignoreJumpOver) {
	var c;
	var inJumpOver = false;
	for(;;) {
		c = this.space.getAsChar(this.x, this.y);
		if(inJumpOver) {
			if(c === ';' && !ignoreJumpOver) {
				inJumpOver = false;
			}
		} else {
			if(c === ';' && !ignoreJumpOver) {
				inJumpOver = true;
			} else if(c !== ' ') {
				break;
			}
		}
		this.advance();
	}
	return c;
};

BefungeIP.prototype.reverse = function() {
	this.dx *= -1;
	this.dy *= -1;
};

BefungeIP.prototype.get = function(x, y) {
	return this.space.get(x + this.offsetX, y + this.offsetY);
};

BefungeIP.prototype.getAsNumber = function(x, y) {
	return this.space.getAsNumber(x + this.offsetX, y + this.offsetY);
};

BefungeIP.prototype.getAsChar = function(x, y) {
	return this.space.getAsChar(x + this.offsetX, y + this.offsetY);
};

BefungeIP.prototype.set = function(x, y, val) {
	this.space.set(x + this.offsetX, y + this.offsetY, val);
};

BefungeIP.prototype.getSysInfo = function() {
	var date = new Date();
	var info = [
		1,
		4,
		1254,
		1,
		0,
		'/',
		2,
		this.ipId,
		0,
		this.y,
		this.x,
		this.dy,
		this.dx,
		this.offsetY,
		this.offsetX,
		0,	// todo
		0,	// todo
		0,	// todo
		0,	// todo
		(date.getFullYear() - 1900) * 256 * 256 + (date.getMonth() + 1) * 256 + date.getDate(),
		date.getHours() * 256 * 256 + date.getMinutes() * 256 + date.getSeconds(),
		ip.stackStack.length
	];
	for(var i = 0; i < ip.stackStack.length; i++) {
		info.push(ip.stackStack[i].stack.length);
	}
	info.push(0, 0, 0);
	return info;
};

function BefungeInterpreter(initialSpace, options) {
	var self = this;
	Duplex.call(this, options);
	this.space = new BefungeSpace(initialSpace);
	this.instructionPointers = [new BefungeIP(this.space)];
	this.stopped = false;
	this.ipsToRemove = [];
	this.quitFlag = false;
	this.returnValue = null;
	this.bfpaused = true;
	this.currentIpIdx = 0;
	this.bfWritableEOFFlag = false;

	this.setupStreams();

	this.instructionSet = {
		'^': function(ip) {			// go north
			ip.setDirection(0, -1);
		},
		'v': function(ip) {			// go south
			ip.setDirection(0, 1);
		},
		'>': function(ip) {			// go east
			ip.setDirection(1, 0);
		},
		'<': function(ip) {			// go west
			ip.setDirection(-1, 0);
		},
		'?': function(ip) {			// turn random
			ip.setDirection(Math.floor(Math.random() * 4));
		},
		'[': function(ip) {			// turn left
			ip.setDirection(ip.getDirectionId() - 1);
		},
		']': function(ip) {			// turn right
			ip.setDirection(ip.getDirectionId() + 1);
		},
		'r': function(ip) {			// reverse
			ip.reverse();
		},
		'x': function(ip) {			// set direction
			var dy = ip.curStack().popAsNumber();
			var dx = ip.curStack().popAsNumber();
			ip.setDirection(dx, dy);
		},
		'#': function(ip) {			// trampoline
			ip.advanceOver();
		},
		'@': function(ip) {			// stop
			this.ipsToRemove.push(ip);
		},
		'j': function(ip) {			// jump forward
			ip.advance(ip.curStack().popAsNumber());
			ip.advanceUntil();
		},
		'q': function(ip) {			// quit
			this.quitFlag = true;
			this.returnValue = ip.curStack().popAsNumber();
		},
		'k': function(ip) {			// iterate
			var count = ip.curStack().popAsNumber();
			ip.advanceOver();
			for(var i = 0; i < count; i++) {
				this.executeInstruction(this.space.getAsChar(ip.x, ip.y), ip);
			}
		},
		'!': function(ip) {			// not
			var val = ip.curStack().popAsNumber();
			ip.curStack.push(val === 0 ? 1 : 0);
		},
		'`': function(ip) {			// greater than
			var val1 = ip.curStack().popAsNumber();
			var val2 = ip.curStack().popAsNumber();
			ip.curStack().push(val2 > val1 ? 1 : 0);
		},
		'_': function(ip) {			// horizontal if
			if(ip.curStack().popAsNumber() === 0) {
				ip.setDirection(1, 0);
			} else {
				ip.setDirection(-1, 0);
			}
		},
		'|': function(ip) {			// vertical if
			if(ip.curStack().popAsNumber() === 0) {
				ip.setDirection(0, 1);
			} else {
				ip.setDirection(0, -1);
			}
		},
		'w': function(ip) {			// compare
			var b = ip.curStack().popAsNumber();
			var a = ip.curStack().popAsNumber();
			if(a < b) {
				ip.setDirection(ip.getDirectionId() - 1);
			} else if(a > b) {
				ip.setDirection(ip.getDirectionId() + 1);
			}
		},
		'0': function(ip) { ip.curStack().push(0); },	// number pushing
		'1': function(ip) { ip.curStack().push(1); },
		'2': function(ip) { ip.curStack().push(2); },
		'3': function(ip) { ip.curStack().push(3); },
		'4': function(ip) { ip.curStack().push(4); },
		'5': function(ip) { ip.curStack().push(5); },
		'6': function(ip) { ip.curStack().push(6); },
		'7': function(ip) { ip.curStack().push(7); },
		'8': function(ip) { ip.curStack().push(8); },
		'9': function(ip) { ip.curStack().push(9); },
		'a': function(ip) { ip.curStack().push(10); },
		'b': function(ip) { ip.curStack().push(11); },
		'c': function(ip) { ip.curStack().push(12); },
		'd': function(ip) { ip.curStack().push(13); },
		'e': function(ip) { ip.curStack().push(14); },
		'f': function(ip) { ip.curStack().push(15); },
		'+': function(ip) {			// addition
			ip.curStack().push(ip.curStack().popAsNumber() + ip.curStack().popAsNumber());
		},
		'*': function(ip) {			// multiplication
			ip.curStack().push(ip.curStack().popAsNumber() * ip.curStack().popAsNumber());
		},
		'-': function(ip) {			// subtraction
			var a = ip.curStack.popAsNumber();
			var b = ip.curStack.popAsNumber();
			ip.curStack().push(b - a);
		},
		'/': function(ip) {			// division
			var a = ip.curStack.popAsNumber();
			var b = ip.curStack.popAsNumber();
			if(a === 0) ip.curStack().push(0);
			else ip.curStack().push(b / a);
		},
		'%': function(ip) {			// division
			var a = ip.curStack.popAsNumber();
			var b = ip.curStack.popAsNumber();
			if(a === 0) ip.curStack().push(0);
			else ip.curStack().push(b % a);
		},
		'"': function(ip) {			// begin string mode
			ip.stringMode = true;
		},
		"'": function(ip) {			// fetch character
			ip.advance();
			ip.curStack().push(this.space.getAsChar(ip.x, ip.y));
		},
		's': function(ip) {			// store character
			ip.advance();
			this.space.set(ip.x, ip.y, ip.curStack().popAsChar());
		},
		'$': function(ip) {			// pop
			ip.curStack().pop();
		},
		':': function(ip) {			// duplicate
			var val = ip.curStack().pop();
			ip.curStack().push(val);
			ip.curStack().push(val);
		},
		'\\': function(ip) {		// swap
			var a = ip.curStack().pop();
			var b = ip.curStack().pop();
			ip.curStack().push(a);
			ip.curStack().push(b);
		},
		'n': function(ip) {			// clear stack
			ip.curStack().clear();
		},
		'{': function(ip) {			// begin block
			var n = ip.curStack().popAsNumber();
			var i;
			ip.stackStack.unshift(new BefungeStack());
			ip.stackStack[0].transferFrom(ip.stackStack[1], n);
			ip.stackStack[1].push(ip.offsetX, ip.offsetY);
			ip.offsetX = ip.x + ip.dx;
			ip.offsetY = ip.y + ip.dy;
		},
		'}': function(ip) {			// end block
			var n = ip.curStack().popAsNumber();
			var i;
			ip.offsetY = ip.stackStack[1].popAsNumber();
			ip.offsetX = ip.stackStack[1].popAsNumber();
			ip.stackStack[1].transferFrom(ip.stackStack[0], n);
			ip.stackStack.shift();
		},
		'u': function(ip) {
			if(ip.stackStack.length < 2) {
				ip.reverse();
				return;
			}
			var n = ip.curStack().popAsNumber();
			if(n > 0) {
				ip.stackStack[0].transferFromPushPop(ip.stackStack[1], n);
			} else if(n < 0) {
				ip.stackStack[0].transferFromPushPop(ip.stackStack[1], -n);
			}
		},
		'g': function(ip) {			// get
			var y = ip.curStack().popAsNumber();
			var x = ip.curStack().popAsNumber();
			ip.curStack().push(ip.getAsChar(x, y));
		},
		'p': function(ip) {			// put
			var y = ip.curStack().popAsNumber();
			var x = ip.curStack().popAsNumber();
			var val = ip.curStack().popAsChar();
			ip.set(x, y, val);
		},
		'y': function(ip) {			// sys info
			var n = ip.curStack().popAsNumber();
			var info = ip.getSysInfo();
			info.reverse();
			info.forEach(function(el) {
				ip.curStack().push(el);
			});
			if(n > 0) {
				var el = ip.curStack().stack[ip.curStack().stack.length - n];
				for(var i = 0; i < info.length; i++) {
					ip.curStack().pop();
				}
				ip.curStack.push(el);
			}
		},
		'z': function() {},			// no-op
		't': function(ip) {			// split
			var newIp = new BefungeIP(ip);
			newIp.reverse();
			this.instructionPointers.unshift(newIp);
		},
		'.': function(ip) {			// output number
			var num = ip.curStack().popAsNumber();
			this.asyncInstruction(ip, function(cb) {
				this.outputNumber(num, cb);
			});
		},
		',': function(ip) {
			this.asyncInstruction(ip, function(cb) {
				this.outputChar(ip.curStack().popAsChar(), cb);
			});
		},
		'&': function(ip) {
			this.asyncInstruction(ip, function(cb) {
				this.inputNumber(function(error, num) {
					if(error) return cb(error);
					if(num === null) {
						ip.reverse();
					} else {
						ip.curStack().push(num);
					}
					cb();
				});
			});
		},
		'~': function(ip) {
			this.asyncInstruction(ip, function(cb) {
				this.inputChar(function(error, ch) {
					if(error) return cb(error);
					if(ch === null) {
						ip.reverse();
					} else {
						ip.curStack().push(ch);
					}
					cb();
				});
			});
		}
	};

	setImmediate(function() {
		self.run();
	});
}
inherits(BefungeInterpreter, Duplex);

BefungeInterpreter.prototype.asyncInstruction = function(ip, instructionFunc) {
	var self = this;
	this.bfpause();
	instructionFunc.call(this, function(error) {
		if(error) return self.emit(error);
		setImmediate(function() {
			self.bfresume();
		});
	});
};

BefungeInterpreter.prototype.executeInstruction = function(ch, ip) {
	if(this.instructionSet[ch]) {
		this.instructionSet[ch].call(this, ip);
	} else {
		ip.reverse();
	}
};

BefungeInterpreter.prototype.tickIP = function(ip) {
	if(ip.stopped || this.quitFlag || this.stopped) {
		return;
	}
	if(!ip.firstTick) {
		ip.advanceOver();
	} else {
		ip.firstTick = false;
	}
	if(ip.stringMode) {
		var ch = this.space.getAsChar(ip.x, ip.y);
		if(ch === '"') {
			ip.stringMode = false;
			ip.advanceOver();
		} else {
			ip.curStack().push(ch);
			ip.advance();
			if(ch === ' ') {
				ip.advanceUntil(true);
			}
		}
	} else {
		var instruction = this.space.getAsChar(ip.x, ip.y);
		if(instruction === ' ') instruction = ip.advanceUntil();
		this.executeInstruction(instruction, ip);
	}
};

BefungeInterpreter.prototype.run = function() {
	if(this.stopped) return;
	this.bfpaused = false;
	var ip;
	for(;;) {
		ip = this.instructionPointers[this.currentIpIdx];
		this.tickIP(ip);
		if(this.quitFlag) {
			this.stopped = true;
			this.emit('fungestop');
			break;
		}
		this.currentIpIdx++;
		if(this.currentIpIdx >= this.instructionPointers.length) {
			if(this.ipsToRemove.length) {
				this.instructionPointers = this.instructionPointers.filter(function(ip) {
					return self.ipsToRemove.indexOf(ip) === -1;
				});
				this.ipsToRemove = [];
			}
			this.currentIpIdx = 0;
		}
		if(this.bfpaused) break;
	}
};

BefungeInterpreter.prototype.stopInterpreter = function() {
	if(!this.stopped) {
		this.stopped = true;
		this.emit('fungestop');
	}
};

BefungeInterpreter.prototype.bfresume = function() {
	if(this.bfpaused) {
		this.run();
	}
};

BefungeInterpreter.prototype.bfpause = function() {
	this.bfpaused = true;
};

BefungeInterpreter.prototype.setupStreams = function() {
	var self = this;
	this._inputQueue = [];
	this._inputWantedQueue = [];
	this._waitingForReadCallback = null;
	this.on('fungestop', function() {
		this.push(null);
	});
	this.on('finish', function() {
		self.bfWritableEOFFlag = true;
		this.readMoreInput();
	});
};

BefungeInterpreter.prototype.inputChar = function(cb) {
	if(this.bfWritableEOFFlag) return cb(null, null);
	this._inputWantedQueue.push({
		type: 'char',
		cb: cb
	});
	this.readMoreInput();
};

BefungeInterpreter.prototype.inputNumber = function(cb) {
	if(this.bfWritableEOFFlag) return cb(null, null);
	this._inputWantedQueue.push({
		type: 'number',
		cb: cb
	});
	this.readMoreInput();
};

BefungeInterpreter.prototype.outputChar = function(ch, cb) {
	if(this.push(ch)) {
		cb();
	} else {
		this._waitingForReadCallback = cb;
	}
};

BefungeInterpreter.prototype.outputNumber = function(num, cb) {
	var res;
	if(this.isReadableObjectMode()) {
		res = this.push(num);
	} else {
		res = this.push('' + num + ' ');
	}
	if(res) {
		cb();
	} else {
		this._waitingForReadCallback = cb;
	}
};

BefungeInterpreter.prototype.readMoreInput = function() {
	var self = this;
	var buffer = '';
	var ch;

	if(this.bfWritableEOFFlag) {
		while(this._inputWantedQueue.length) {
			this._inputWantedQueue.shift().cb(null, null);
		}
		return;
	}

	function nextChar() {
		var inputQueueEntry = self._inputQueue[0];
		if(!inputQueueEntry) return undefined;
		if(inputQueueEntry.chunk instanceof Buffer) inputQueueEntry.chunk = inputQueueEntry.chunk.toString('utf8');
		if(typeof inputQueueEntry.chunk === 'number') inputQueueEntry.chunk = '' + inputQueueEntry.chunk + '\n';
		if(typeof inputQueueEntry.chunk != 'string') inputQueueEntry.chunk = '' + inputQueueEntry.chunk;
		if(!inputQueueEntry.chunk.length) {
			if(inputQueueEntry.cb) inputQueueEntry.cb();
			self._inputQueue.shift();
			return nextChar();
		}
		var ch = inputQueueEntry.chunk[0];
		inputQueueEntry.chunk = inputQueueEntry.chunk.slice(1);
		if(!inputQueueEntry.chunk.length) {
			if(inputQueueEntry.cb) inputQueueEntry.cb();
			self._inputQueue.shift();
		}
		return ch;
	}

	for(;;) {

		var nextWantedInput = this._inputWantedQueue[0];
		if(!nextWantedInput) return;

		if(nextWantedInput.type === 'char') {
			ch = nextChar();
			if(ch !== undefined) {
				nextWantedInput.cb(null, ch);
				this._inputWantedQueue.shift();
			} else {
				return;
			}
		} else if(nextWantedInput.type === 'number') {
			for(;;) {
				ch = nextChar();
				if(ch === undefined) {
					if(buffer.length) {
						this._inputQueue.unshift({
							chunk: buffer
						});
					}
					return;
				}
				if(/[0-9]/.test(ch)) {
					buffer += ch;
					break;
				}
			}
			for(;;) {
				ch = nextChar();
				if(ch === undefined) {
					if(buffer.length) {
						this._inputQueue.unshift({
							chunk: buffer
						});
					}
					return;
				}
				if(!/[0-9]/.test(ch)) {
					nextWantedInput.cb(null, parseInt(buffer, 10));
					buffer = '';
					this._inputWantedQueue.shift();
					break;
				}
				buffer += ch;
			}
		}
	}
};

BefungeInterpreter.prototype._write = function(chunk, encoding, cb) {
	this._inputQueue.push({
		chunk: chunk,
		encoding: encoding,
		cb: cb
	});
	this.readMoreInput();
};

BefungeInterpreter.prototype._read = function() {
	if(this._waitingForReadCallback) {
		this._waitingForReadCallback();
		this._waitingForReadCallback = null;
	}
};


module.exports = BefungeInterpreter;
