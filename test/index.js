'use strict';

var fs = require('fs');
var assert = require('assert');
var test = require('testit');
var halts = require('../');

fs.readdirSync(__dirname + '/halting').forEach(function (testCase) {
  test('halts - ' + testCase, function () {
    halts(fs.readFileSync(__dirname + '/halting/' + testCase, 'utf8'));
  });
});
fs.readdirSync(__dirname + '/not-halting').forEach(function (testCase) {
  test('does not halt - ' + testCase, function () {
    try {
      halts(fs.readFileSync(__dirname + '/not-halting/' + testCase, 'utf8'));
    } catch (ex) {
      if (!(ex && ex.node && ex.node.type)) {
        throw ex;
      }
      return;
    }
    throw new Error('Failed to detect that the program does not halt');
  });
});
