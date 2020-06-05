import { callMetaComponent } from "../testHelpers";

test("MetaVariable", () => {
  const result = callMetaComponent(
    "mt-variable",
    `<mt-variable id="thing"></mt-variable>`,
    "",
    true
  );
  const node = result.metaComponent.nodes[0];
  expect(node.type).toBe("Variable");
  if (node.type !== "Variable") throw Error("Should be 'Variable'."); // narrowing TS typing
  expect(result.metaComponent.props["thing"].required).toBe(true);
});

test("MetaVariable", () => {
  const result = callMetaComponent(
    "mt-variable",
    `<mt-variable id="thing" optional></mt-variable>`,
    "",
    true
  );
  const node = result.metaComponent.nodes[0];
  expect(node.type).toBe("Variable");
  if (node.type !== "Variable") throw Error("Should be 'Variable'."); // narrowing TS typing
  expect(result.metaComponent.props["thing"].required).toBe(false);
  expect(node.id).toBe("thing");
});

test("MetaVariable", () => {
  const result = callMetaComponent(
    "mt-variable",
    `<mt-variable id="thing?" optional></mt-variable>`,
    "",
    true
  );
  const node = result.metaComponent.nodes[0];
  expect(node.type).toBe("Variable");
  if (node.type !== "Variable") throw Error("Should be 'Variable'."); // narrowing TS typing
  expect(result.metaComponent.props["thing"].required).toBe(false);
  expect(node.id).toBe("thing");
});

test("Throws on syntax error with haltOnErrors=true", () => {
  expect(() => {
    callMetaComponent("mt-variable", `<mt-variable></mt-variable>`, "", true);
  }).toThrow();
});

test("Doesn't throw on syntax error with haltOnErrors=false", () => {
  const result = callMetaComponent(
    "mt-variable",
    `<mt-variable></mt-variable>`,
    "",
    false
  );
  expect(result.metaComponent.nodes.length).toBe(1);
});

test("MetaVariable with placeholder is retained", () => {
  const result = callMetaComponent(
    "mt-variable",
    `<mt-variable id="thing">some placeholder</mt-variable>`,
    "",
    true
  );
  const node = result.metaComponent.nodes[0];
  expect(node.type).toBe("Variable");
  if (node.type !== "Variable") throw Error("Should be 'Variable'."); // narrowing TS typing
  expect(result.metaComponent.props["thing"].required).toBe(true);
  expect(node.children.length).toBe(1);
  const firstChild = node.children[0];
  expect(firstChild.type).toBe("Text");
});
