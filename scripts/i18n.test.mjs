import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import ts from "typescript";

const read = name => JSON.parse(readFileSync(new URL(`../messages/${name}.json`, import.meta.url), "utf8"));
const vi = read("vi"), en = read("en"), keys = read("source-keys");
test("Vietnamese and English dictionaries cover every registered message", () => {
  assert.deepEqual(Object.keys(vi).sort(), Object.keys(en).sort());
  for (const key of Object.values(keys)) {
    assert.equal(typeof vi[key], "string", key);
    assert.equal(typeof en[key], "string", key);
    assert(en[key].trim(), key);
    assert.deepEqual([...vi[key].matchAll(/\{v\d+\}/g)].map(m => m[0]).sort(), [...en[key].matchAll(/\{v\d+\}/g)].map(m => m[0]).sort(), key);
  }
});
test("literal copy calls have a registered English translation", () => {
  for (const directory of ["app/components", "app/booths/components"]) {
    for (const file of readdirSync(directory).filter(f => f.endsWith(".tsx"))) {
      const source = ts.createSourceFile(file, readFileSync(`${directory}/${file}`, "utf8"), ts.ScriptTarget.Latest, true);
      function visit(node) {
        if (ts.isCallExpression(node) && node.expression.getText(source) === "t" && ts.isStringLiteral(node.arguments[0])) {
          const text = node.arguments[0].text.replace(/\s+/g, " ").trim();
          assert(keys[text], `${file}: ${text}`);
        }
        ts.forEachChild(node, visit);
      }
      visit(source);
    }
  }
});
