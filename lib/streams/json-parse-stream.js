var Parser = require('jsonparse');
var ZTransform = require('../transform');
var util = require('util');

function JSONParseStream (options) {
  var self = this;
  this.parser = new Parser();

  if(!options) options = {};
  if(!options.objectMode) options.objectMode = true;
  ZTransform.call(this, options);

  this.parser.onValue = function (value){
    if(this.stack.length === 0) self.push(value);
  };
}
util.inherits(JSONParseStream, ZTransform);

JSONParseStream.prototype._transform = function(chunk, encoding, done) {
  this.parser.write(chunk);
  done();
};

module.exports = exports = JSONParseStream;