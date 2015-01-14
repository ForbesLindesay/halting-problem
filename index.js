'use strict';

var acorn = require('acorn');
var walk = require('acorn/util/walk');

module.exports = halts;
function halts(src) {
  var ast = typeof src === 'string' ? acorn.parse(src, {
    ecmaVersion: 6,
    allowReturnOutsideFunction: true,
    locations: true
  }) : src;
  var hasBreak = false;
  var writeHandlers = [];
  var readHandlers = [];
  var callHandlers = [];
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
  function testForBreak(fn) {
    var before = hasBreak;
    hasBreak = false;
    fn();
    var result = hasBreak;
    hasBreak = before;
    return result;
  }
  function whileStatement(node, state, walk) {
    var test, body;
    var hasBreak = testForBreak(function () {
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
        throw node;
      }
      hasBreak = true;
    },
    LabeledStatement: function (node, st, c) {
      try {
        c(node.body, st, "Statement");
      } catch (ex) {
        if (ex.type === 'BreakStatement' && ex.label && ex.label.type === 'Identifier' &&
            ex.label.name === node.label.name) {
          return;
        }
        throw ex;
      }
    },
    ReturnStatement: function (node, st, c) {
      if (node.argument) c(node.argument, st, "Expression");
      throw node;
    },
    YieldExpression: function (node, st, c) {
      if (node.argument) c(node.argument, st, "Expression");
      throw node;
    },
    ThrowStatement: function (node, st, c) {
      c(node.argument, st, "Expression");
      throw node;
    },
    Function: function (node, st, c) {
      try {
        c(node.body, st, "ScopeBody");
      } catch (ex) {
        if (ex.type === 'ReturnStatement' ||
            ex.type === 'ThrowStatement' ||
            ex.type === 'YieldExpression') {
          return;
        }
        throw ex;
      }
    },
    Program: function (node, st, c) {
      try {
        for (var i = 0; i < node.body.length; ++i)
          c(node.body[i], st, "Statement");
      } catch (ex) {
        if (ex.type === 'ReturnStatement' || ex.type === 'ThrowStatement') {
          return;
        }
        throw ex;
      }
    },
    TryStatement: function (node, st, c) {
      try {
        c(node.block, st, "Statement");
      } catch (ex) {
        if (ex.type === 'ThrowStatement') {
          return;
        }
        throw ex;
      }
      if (node.handler) c(node.handler.body, st, "ScopeBody");
      if (node.finalizer) c(node.finalizer, st, "Statement");
    }
  });
}