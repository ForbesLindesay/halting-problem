'use strict';

var start = Date.now();

module.exports.reset = function (time) {
  time = time || 1000;
  start = Date.now() + time;
};
module.exports.protect = function (line) {
  if (Date.now() > start) {
    var err = new Error('Possible infinite loop detected on line ' + line);
    throw err;
  }
};