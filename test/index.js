'use strict';

var fs = require('fs');
var assert = require('assert');
var test = require('testit');
var halts = require('../');

test('halting problem', function () {
  test('halting', function () {
    fs.readdirSync(__dirname + '/halting').forEach(function (testCase) {
      test(testCase, function () {
        halts(fs.readFileSync(__dirname + '/halting/' + testCase, 'utf8'));
      });
    });
  });
  test('not halting', function () {
    fs.readdirSync(__dirname + '/not-halting').forEach(function (testCase) {
      test(testCase, function () {
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
  });
});

test('loop protect', function () {
  test('halting', function () {
    fs.readdirSync(__dirname + '/halting').forEach(function (testCase) {
      test('halts - ' + testCase, function () {
        halts.reset();
        var src = halts.loopProtect(fs.readFileSync(__dirname + '/halting/' + testCase, 'utf8'));
        Function('haltingProblem', src)(halts);
      });
    });
  });
  test('not halting', function () {
    fs.readdirSync(__dirname + '/not-halting').forEach(function (testCase) {
      test(testCase, function () {
        halts.reset(100);
        try {
          var src = halts.loopProtect(fs.readFileSync(__dirname + '/not-halting/' + testCase, 'utf8'));
          Function('haltingProblem', src)(halts);
        } catch (ex) {
          if (!(ex && ex.message && /Possible infinite loop/.test(ex.message))) {
            throw ex;
          }
          return;
        }
        throw new Error('Failed to detect that the program does not halt');
      });
    });
  });
  test('hard not halting', function () {
    fs.readdirSync(__dirname + '/hard-not-halting').forEach(function (testCase) {
      test(testCase, function () {
        halts.reset(100);
        try {
          var src = halts.loopProtect(fs.readFileSync(__dirname + '/hard-not-halting/' + testCase, 'utf8'));
          Function('haltingProblem', src)(halts);
        } catch (ex) {
          if (!(ex && ex.message && /Possible infinite loop/.test(ex.message))) {
            throw ex;
          }
          return;
        }
        throw new Error('Failed to detect that the program does not halt');
      });
    });
  });
});
