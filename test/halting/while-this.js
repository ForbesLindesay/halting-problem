function foo() {
  this.cont = true;
  while (this.cont) {
    this.cont = false;
  }
}
foo.call({});