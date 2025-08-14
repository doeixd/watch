// Test generator properties
const syncGen = (function* () {})();
const asyncGen = (async function* () {})();

console.log("Sync generator:");
console.log("  Symbol.iterator:", Symbol.iterator in syncGen);
console.log("  Symbol.asyncIterator:", Symbol.asyncIterator in syncGen);

console.log("Async generator:");
console.log("  Symbol.iterator:", Symbol.iterator in asyncGen);
console.log("  Symbol.asyncIterator:", Symbol.asyncIterator in asyncGen);

// Test actual iteration
const testSync = function* () {
  yield 1;
  yield 2;
  return 3;
};

const testAsync = async function* () {
  yield 1;
  yield 2;
  return 3;
};

console.log("\nSync generator test:");
const sg = testSync();
console.log("  Has Symbol.iterator?", Symbol.iterator in sg);
console.log("  Next:", sg.next());
console.log("  Next:", sg.next());
console.log("  Next:", sg.next());

console.log("\nAsync generator test:");
const ag = testAsync();
console.log("  Has Symbol.asyncIterator?", Symbol.asyncIterator in ag);
ag.next().then((v) => console.log("  Next:", v));
