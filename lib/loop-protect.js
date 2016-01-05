'use strict';

// inspired by https://github.com/jsbin/loop-protect

var acorn = require('acorn');
var walk = require('acorn/dist/walk');

module.exports = protect;
function protect(src, protectFn) {
  protectFn = protectFn || 'haltingProblem.protect';
  var ast = acorn.parse(src, {
    ecmaVersion: 6,
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
  function callExpression(node, ancestors) {
    var replacement =
      '(' + protectFn + '(' + node.loc.start.line + '),' + source(node) + ')';

    // The following check is needed to prevent the added wrapping parenthesis
    // from being interpreted as a function call.
    if (ancestors[ancestors.length - 2].type === 'ExpressionStatement') {
      replacement = ';' + replacement;
    }

    replace(node, replacement);
  }

  walk.ancestor(ast, {
    WhileStatement: loopStatement,
    DoWhileStatement: loopStatement,
    ForStatement: loopStatement,
    ForInStatement: loopStatement,
    ForOfStatement: loopStatement,

    CallExpression: callExpression,
    NewExpression: callExpression,
    TaggedTemplateExpression: callExpression
  });

  return src.join('');
}
