# halting-problem

Solves the halting problem :)

Not really, sadly that's impossible.  What this program does aim to do is pick up on some really simple examples of while loops and for loops that never terminate.  It's extremely limited and written with the aim of only ever picking up programs that definitely never halt.

[![Build Status](https://img.shields.io/travis/ForbesLindesay/halting-problem/master.svg)](https://travis-ci.org/ForbesLindesay/halting-problem)
[![Dependency Status](https://img.shields.io/gemnasium/ForbesLindesay/halting-problem.svg)](https://gemnasium.com/ForbesLindesay/halting-problem)
[![NPM version](https://img.shields.io/npm/v/halting-problem.svg)](https://www.npmjs.org/package/halting-problem)

## Installation

    npm install halting-problem

## Usage

```js
var halts = require('halting-problem');
try {
  halts('while (true);');
  console.log('It halts!');
} catch (ex) {
  console.log('oops, this program never halts');
}
```

## Examples

This example halts:

```js
var n = 10;
while (n > 0) {
  n--;
}
```

In this example, the user accidentally typed `m` instead of `n`, so this does not halt:

```js
var n = 10;

while (n > 0) {
  m--;
}
```

## Assumptions

Erring on the side of safety, this assumes that any function call results in any loops exiting.  For example, they could throw an error.

Erring on the side of pragmatism, this assumes that there is no dead-code.  e.g. it incorrectly states that the following code does not terminate:

```js
if (false) {
  while (true) {}
}
```

Erring on the side of pragmatism, this assumes that no exceptions are thrown other than explicit `throw` statements.

Throwing an error is treated as an acceptable way out of an infinite loop, even if there is no catch block to handle it.

## Contributing

If you find any program that does eventually halt, but that this library throws an error for (but that doesn't break any of the assumptions) submit a pull request to add the script to `/test/halting` and I will do my best to fix it.

There are crazy numbers of programs that don't halt, but that this program won't catch.  Please **do not** submit an issue for such programs.  Also **do not** submit pull requests that just add a test case for such a program.  Please do add code to detect such cases though.  I'd love this to catch a more significant number of non-trivial cases where JavaScript will go into an infinite loop.

## License

  MIT
