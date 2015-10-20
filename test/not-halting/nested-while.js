export default function ({Plugin, types: t}) {
  return new Plugin('ast-transform', {
    visitor: {
      Identifier(node) {
        while (true) {}
        return t.identifier(node.name.split('').reverse().join(''));
      }
    }
  });
}
