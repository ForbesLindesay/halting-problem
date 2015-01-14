foo: while (true) {
  while (true) {
    break foo;
  }
}
foo: while (true) {
  bar: while (true) {
    break foo;
  }
}