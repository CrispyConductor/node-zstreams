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
			row.forEach(function(cell, x) {
				self.set(x, y, cell);
			});
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

// arg can either be space or another IP
function BefungeIP(space) {
	if(space && space.x && space.dx) {
		var other = space;
		this.dx = other.dx;
		this.dy = other.dy;
		this.x = other.x;
		this.y = other.y;
		this.space = other.space;
		this.stackStack = other.stackStack.map(function(stack) {
			return new BefungeStack(stack);
		});
	} else {
		this.dx = 1;
		this.dy = 0;
		this.x = 0;
		this.y = 0;
		// Index 0 is top of the stack here
		this.stackStack = [new BefungeStack()];
		this.space = space;
	}
}

BefungeIP.prototype.curStack = function() {
	return this.stack[0];
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
			this.x = this.getQuad(1, this.y).length - 1;
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

BefungeIP.prototype.advanceUntil = function() {
	var c;
	var inJumpOver = false;
	for(;;) {
		c = this.space.getAsChar(this.x, this.y);
		if(inJumpOver) {
			if(c === ';') {
				inJumpOver = false;
			}
		} else {
			if(c === ';') {
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

function BefungeInterpreter(initialSpace, fingerprints) {
	EventEmitter.call(this);
	this.space = new BefungeSpace(initialSpace);
	this.instructionPointers = [new BefungeIP(this.space)];
	this.stopped = false;
	this.ipsToRemove = [];
	this.quitFlag = false;
	this.returnValue = null;

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
		'!': function(ip) {
			var val = ip.curStack().popAsNumber();
			ip.curStack.push(val === 0 ? 1 : 0);
		},
		'`': function(ip) {
			var val1 = ip.curStack().popAsNumber();
			var val2 = ip.curStack().popAsNumber();
			ip.curStack().push(val2 > val1 ? 1 : 0);
		},
		'_': function(ip) {
			if(ip.curStack().popAsNumber() === 0) {
				ip.setDirection(1, 0);
			} else {
				ip.setDirection(-1, 0);
			}
		},
		'|': function(ip) {
			if(ip.curStack().popAsNumber() === 0) {
				ip.setDirection(0, 1);
			} else {
				ip.setDirection(0, -1);
			}
		},
		'w': function(ip) {
			var b = ip.curStack().popAsNumber();
			var a = ip.curStack().popAsNumber();
			if(val)
		}
	};
}
inherits(BefungeInterpreter, EventEmitter);

BefungeInterpreter.prototype.executeInstruction = function(ch, ip) {

};

BefungeInterpreter.prototype.tickIP = function(ip) {
	var instruction = this.space.getAsChar(ip.x, ip.y);
	if(instruction === ' ') instruction = ip.advanceUntil();

};

BefungeInterpreter.prototype.tick = function() {
	var self = this;
	for(var i = 0; i < this.instructionPointers.length; i++) {
		this.tickIP(this.instructionPointers[i]);
		if(this.quitFlag) break;
	}
	if(this.ipsToRemove.length) {
		this.instructionPointers = this.instructionPointers.filter(function(ip) {
			return self.ipsToRemove.indexOf(ip) === -1;
		});
		this.ipsToRemove = [];
	}
	if(!this.instructionPointers.length || this.quitFlag) {
		this.stopped = true;
		this.emit('stop');
	}
};

function BefungeStream(befunge, options) {

}

BefungeStream.prototype._read = function(size) {

};

BefungeStream.prototype._write = function(chunk, encoding, cb) {

};

