import { callMetaComponent } from "../testHelpers";

test("Can generate logical branches", () => {
  const result = callMetaComponent(
    "m-if",
    `<m-if test="frog !== 'frush'   ">hello</m-if>`,
    "",
    true
  );
  const node = result.metaComponent.nodes[0];
  expect(result.metaComponent.nodes[0].type).toBe("If");
  if (node.type !== "If") throw Error("Should be 'If'."); // narrowing TS typing
  expect(node.parseError).toBe(false);
  if (node.parseError !== false) throw Error("Shouldn't be a parse error"); // narrowing TS typing
  expect(node.testAsJavaScriptExpression).toBe("frog !== 'frush'");
  expect(node.testAsPHPExpression).toBe('$frog != "frush"');
  expect(node.testAsPythonExpression).toBe('frog != "frush"');
  expect(node.children.length).toBe(1);
});

test("Can generate logical branches in JavaScript", () => {
  const result = callMetaComponent(
    "m-if",
    `<m-if test="frog !== 'frush'   ">hello</m-if>`,
    "",
    true
  );
  const node = result.metaComponent.nodes[0];
  expect(result.metaComponent.nodes[0].type).toBe("If");
  if (node.type !== "If") throw Error("Should be 'If'."); // narrowing TS typing
  expect(node.parseError).toBe(false);
  if (node.parseError !== false) throw Error("Shouldn't be a parse error"); // narrowing TS typing
  expect(node.testAsJavaScriptExpression).toBe("frog !== 'frush'");
});

test("Can generate logical branches in Python", () => {
  const result = callMetaComponent(
    "m-if",
    `<m-if test="frog !== 'frush'   ">hello</m-if>`,
    "",
    true
  );
  const node = result.metaComponent.nodes[0];
  expect(result.metaComponent.nodes[0].type).toBe("If");
  if (node.type !== "If") throw Error("Should be 'If'."); // narrowing TS typing
  expect(node.parseError).toBe(false);
  if (node.parseError !== false) throw Error("Shouldn't be a parse error"); // narrowing TS typing
  expect(node.testAsPythonExpression).toBe('frog != "frush"');
});

test("Can generate logical branches in PHP", () => {
  const result = callMetaComponent(
    "m-if",
    `<m-if test="frog !== 'frush'   ">hello</m-if>`,
    "",
    true
  );
  const node = result.metaComponent.nodes[0];
  expect(result.metaComponent.nodes[0].type).toBe("If");
  if (node.type !== "If") throw Error("Should be 'If'."); // narrowing TS typing
  expect(node.parseError).toBe(false);
  if (node.parseError !== false) throw Error("Shouldn't be a parse error"); // narrowing TS typing
  expect(node.testAsPHPExpression).toBe('$frog != "frush"');
});

test("Optional false", () => {
  const result = callMetaComponent(
    "m-if-optional",
    `<m-if test="frog !== 'frush'   ">hello</m-if>`,
    "",
    true
  );
  const node = result.metaComponent.nodes[0];
  expect(result.metaComponent.nodes[0].type).toBe("If");
  if (node.type !== "If") throw Error("Should be 'If'."); // narrowing TS typing
  expect(result.metaComponent.props["frog"].required).toBe(true);
});

test("Optional true", () => {
  const result = callMetaComponent(
    "m-if-optional",
    `<m-if optional test="frog !== 'frush'   ">hello</m-if>`,
    "",
    true
  );
  const node = result.metaComponent.nodes[0];
  expect(result.metaComponent.nodes[0].type).toBe("If");
  if (node.type !== "If") throw Error("Should be 'If'."); // narrowing TS typing
  expect(result.metaComponent.props["frog"].required).toBe(false);
});

test("Throws on syntax error with haltOnErrors=true", () => {
  expect(() => {
    callMetaComponent(
      "m-if",
      `<m-if test="frog ================ 'frush'   ">hello</m-if>`,
      "",
      true
    );
  }).toThrow();
});

test("Can gracefully handle syntax errors without throwing with haltOnErrors=false", () => {
  const result = callMetaComponent(
    "m-if",
    `<m-if test="frog ================ 'frush'   ">hello</m-if>`,
    "",
    false
  );
  const node = result.metaComponent.nodes[0];
  expect(result.metaComponent.nodes[0].type).toBe("If");
  if (node.type !== "If") throw Error("Should be 'If'."); // narrowing TS typing
  expect(node.parseError).toBe(true);
  if (node.parseError !== true) throw Error("Should be a parse error"); // narrowing TS typing
  expect(node.children.length).toBe(1);
});
