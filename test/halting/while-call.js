var something = true;
var i = 10;
function foo() {
  something = false;
  return i--;
}

while(something) {
  foo();
}
while(foo()) {
}