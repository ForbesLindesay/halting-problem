var br = false;
var n = 0;
while (n < 10) {
  foo: while (true) {
    br = !br;
    if (br) break foo;
    n++;
  }
}