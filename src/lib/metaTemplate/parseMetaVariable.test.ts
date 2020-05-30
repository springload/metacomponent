import { callMetaTemplate } from "../testHelpers";

test("MetaVariable", () => {
  const result = callMetaTemplate(
    "mt-variable",
    `<mt-variable id="thing" />`,
    "",
    true
  );
  const node = result.metaTemplate.nodes[0];
  expect(node.type).toBe("Variable");
  if (node.type !== "Variable") throw Error("Should be 'Variable'."); // narrowing TS typing
  expect(node.optional).toBe(false);
});

test("MetaVariable", () => {
  const result = callMetaTemplate(
    "mt-variable",
    `<mt-variable id="thing" optional />`,
    "",
    true
  );
  const node = result.metaTemplate.nodes[0];
  expect(node.type).toBe("Variable");
  if (node.type !== "Variable") throw Error("Should be 'Variable'."); // narrowing TS typing
  expect(node.optional).toBe(true);
  expect(node.id).toBe("thing");
});

test("MetaVariable", () => {
  const result = callMetaTemplate(
    "mt-variable",
    `<mt-variable id="thing?" optional />`,
    "",
    true
  );
  const node = result.metaTemplate.nodes[0];
  expect(node.type).toBe("Variable");
  if (node.type !== "Variable") throw Error("Should be 'Variable'."); // narrowing TS typing
  expect(node.optional).toBe(true);
  expect(node.id).toBe("thing");
});

test("Throws on syntax error with haltOnErrors=true", () => {
  expect(() => {
    callMetaTemplate("mt-variable", `<mt-variable />`, "", true);
  }).toThrow();
});

test("Doesn't throw on syntax error with haltOnErrors=false", () => {
  const result = callMetaTemplate("mt-variable", `<mt-variable />`, "", false);
  expect(result.metaTemplate.nodes.length).toBe(1);
});
