'use strict';

var acorn = require('acorn');
var walk = require('acorn/util/walk');

module.exports = halts;
function halts(src) {
  var ast = typeof src === 'string' ? acorn.parse(src, {
    ecmaVersion: 6,
    allowReturnOutsideFunction: true,
    allowImportExportEverywhere: true,
    allowHashBang: true,
    locations: true
  }) : src;
  var hasBreak = false;
  var hasThrow = false;
  var hasReturnOrYield = false;
  var writeHandlers = [];
  var readHandlers = [];
  var callHandlers = [];
  var breakLabels = [];
  function watch(fn) {
    var writes = [];
    var reads = [];
    var calls = [];
    writeHandlers.push(writes);
    readHandlers.push(reads);
    callHandlers.push(calls);
    fn();
    writeHandlers.pop();
    readHandlers.pop();
    callHandlers.pop();
    return {writes: writes, reads: reads, calls: calls};
  }
  function onWrite(name) {
    writeHandlers.forEach(function (handler) { handler.push(name); });
  }
  function onRead(name) {
    readHandlers.forEach(function (handler) { handler.push(name); });
  }
  function onCall(node) {
    callHandlers.forEach(function (handler) { handler.push(node); });
  }
  function testForBreakOrReturnOrYieldOrThrow(fn) {
    var before = {hasBreak: hasBreak, hasReturnOrYield: hasReturnOrYield, hasThrow: hasThrow, breakLabels: breakLabels};
    hasBreak = false; hasReturnOrYield = false; hasThrow = false; breakLabels = [];
    fn();
    var result = hasBreak || hasReturnOrYield || hasThrow || breakLabels.length;
    hasBreak = before.hasBreak;
    hasReturnOrYield = hasReturnOrYield || before.hasReturnOrYield;
    hasThrow = hasThrow || before.hasThrow;
    breakLabels = before.breakLabels.concat(breakLabels);
    return result;
  }
  function whileStatement(node, state, walk) {
    var test, body;
    var hasBreak = testForBreakOrReturnOrYieldOrThrow(function () {
      test = watch(function () {
        walk(node.test, state, "Expression");
      });
      body = watch(function () {
        walk(node.body, state, "Statement");
      });
    });
    var reads = test.reads;
    var writes = test.writes.concat(body.writes);
    var calls = test.calls.concat(body.calls);
    if (hasBreak) {
      return;
    }
    if (reads.length === 0) {
      var err = new Error('while statement on line ' + node.test.loc.start.line +
                          ' has a constant test.  Either it is always `false` ' +
                          '(making the statement redundant) or it is an infinite loop.');
      err.line = node.test.start.line;
      err.node = node;
      throw err;
    }
    if (calls.length || reads.some(function (name) { return writes.indexOf(name) !== -1; })) {
      return;
    }
    var err = new Error('while statement on line ' + node.test.loc.start.line +
                        ' has a test that contains no variables that get modified ' +
                        'in the loop. Either it is always `false` ' +
                        '(making the statement redundant) or it is an infinite loop.');
    err.line = node.test.loc.start.line;
    err.node = node;
    throw err;
  }
  function callExpression(node, st, c) {
      onCall(node);
      c(node.callee, st, "Expression");
      if (node.arguments) {
        for (var i = 0; i < node.arguments.length; ++i) {
          c(node.arguments[i], st, "Expression");
        }
      }
    }
  walk.recursive(ast, {}, {
    WhileStatement: whileStatement,
    DoWhileStatement: whileStatement,
    Identifier: function (node) { onRead(node.name); },
    ThisExpression: function (node) { onRead('this'); },
    CallExpression: callExpression,
    NewExpression: callExpression,
    AssignmentExpression: function (node, st, c) {
      watch(function () {
        c(node.left, st, "Expression");
      }).reads.forEach(onWrite);
      c(node.right, st, "Expression");
    },
    UpdateExpression: function (node, st, c) {
      watch(function () {
        c(node.argument, st, "Expression");
      }).reads.forEach(onWrite);
    },

    BreakStatement: function (node) {
      if (node.label) {
        breakLabels = breakLabels.concat([node.label.name]);
      }
      hasBreak = true;
    },
    LabeledStatement: function (node, st, c) {
      var before = breakLabels;
      c(node.body, st, "Statement");
      breakLabels = breakLabels.filter(function (name) { return name !== node.label.name || before.indexOf(name) !== -1; });
    },

    ReturnStatement: function (node, st, c) {
      if (node.argument) c(node.argument, st, "Expression");
      hasReturnOrYield = true;
    },
    YieldExpression: function (node, st, c) {
      if (node.argument) c(node.argument, st, "Expression");
      hasReturnOrYield = true;
    },
    ThrowStatement: function (node, st, c) {
      c(node.argument, st, "Expression");
      hasThrow = true;
    },
    Function: function (node, st, c) {
      var hasBreakBefore;
      var breakLabelsBefore = breakLabels;
      var hasThrowBefore = hasThrow;
      var hasReturnOrYieldBefore = hasReturnOrYield;
      c(node.body, st, "ScopeBody");
      hasBreak = hasBreakBefore;
      breakLabels = breakLabelsBefore;
      hasThrow = hasThrowBefore;
      hasReturnOrYield = hasReturnOrYieldBefore;
    },
    TryStatement: function (node, st, c) {
      var hasThrowBefore = hasThrow;
      c(node.block, st, "Statement");
      hasThrow = hasThrowBefore;
      if (node.handler) c(node.handler.body, st, "ScopeBody");
      if (node.finalizer) c(node.finalizer, st, "Statement");
    }
  });
}
