// ex. scripts/build_npm.ts
import { build, emptyDir } from "@deno/dnt";

await emptyDir("./npm");

await build({
  entryPoints: ["./watch.ts"],
  outDir: "./npm",
  test: false,
  typeCheck: false,
  declaration: false,
  scriptModule: false,
  shims: {
    // see JS docs for overview and more options
    deno: false,
  },
  package: {
    // package.json properties
    name: "watch-selector",
    keywords: [
      "selector-observer",
      "webcomponents",
      "mount observer",
      "selector observer"
    ],
    version: Deno.args[0],
    description: "Runs a function when a selector is added to dom",
    license: "MIT",
    repository: {
      type: "git",
      url: "git+https://github.com/doeixd/watch.git",
    },
    bugs: {
      url: "https://github.com/doeixd/watch/issues",
    },
  },
  postBuild() {
    // steps to run after building and before running the tests
    Deno.copyFileSync("LICENSE", "npm/LICENSE");
    Deno.copyFileSync("README.md", "npm/README.md");
  },
});