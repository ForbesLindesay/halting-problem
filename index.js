'use strict';

module.exports = require('./lib/halting-problem');
module.exports.loopProtect = require('./lib/loop-protect');
module.exports.reset = require('./lib/runtime').reset;
module.exports.protect = require('./lib/runtime').protect;