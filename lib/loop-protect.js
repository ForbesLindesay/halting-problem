'use strict';

// inspired by https://github.com/jsbin/loop-protect

var acorn = require('acorn');
var walk = require('acorn-walk');

module.exports = protect;
function protect(src, protectFn) {
  protectFn = protectFn || 'haltingProblem.protect';
  var ast = acorn.parse(src, {
    ecmaVersion: 2020,
    allowReturnOutsideFunction: true,
    allowImportExportEverywhere: true,
    allowHashBang: true,
    locations: true
  });

  src = src.split('');
  function source(node) {
    return src.slice(node.start, node.end).join('')
  }
  function replace(node, str) {
    for (var i = node.start; i < node.end; i++) {
      src[i] = ''
    }
    src[node.start] = str
  }

  function loopStatement(node) {
    var line = (node.test || node.left).loc.start.line;
    if (node.body.type === 'BlockStatement') {
      var src = source(node.body).split('{');
      src[1] = protectFn + '(' + line + ');' + src[1];
      src = src.join('{');
      replace(node.body, src);
    } else {
      replace(node.body, '{' + protectFn + '(' + line + ');' + source(node.body) + '}');
    }
  }
  function functionExpression(node) {
    if (node.body.type === 'BlockStatement') {
      replace(node.body, '{' + protectFn + '(' + node.loc.start.line + ');' + source(node.body).split('{').slice(1).join('{'));
    }
  }

  walk.simple(ast, {
    WhileStatement: loopStatement,
    DoWhileStatement: loopStatement,
    ForStatement: loopStatement,
    ForInStatement: loopStatement,
    ForOfStatement: loopStatement,

    FunctionExpression: functionExpression,
    FunctionDeclaration: functionExpression,
    ArrowFunctionExpression: functionExpression
  });

  return src.join('');
}
