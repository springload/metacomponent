import { callMetaTemplate } from "../testHelpers";

test("Can generate logical branches", () => {
  const result = callMetaTemplate(
    "mt-if",
    `<mt-if test="frog !== 'frush'   ">hello</mt-if>`,
    "",
    true
  );
  const node = result.metaTemplate.nodes[0];
  expect(result.metaTemplate.nodes[0].type).toBe("If");
  if (node.type !== "If") throw Error("Should be 'If'."); // narrowing TS typing
  expect(node.parseError).toBe(false);
  if (node.parseError !== false) throw Error("Shouldn't be a parse error"); // narrowing TS typing
  expect(node.testAsJavaScriptExpression).toBe("frog !== 'frush'");
  expect(node.children.length).toBe(1);
});

test("Optional false", () => {
  const result = callMetaTemplate(
    "mt-if-optional",
    `<mt-if test="frog !== 'frush'   ">hello</mt-if>`,
    "",
    true
  );
  const node = result.metaTemplate.nodes[0];
  expect(result.metaTemplate.nodes[0].type).toBe("If");
  if (node.type !== "If") throw Error("Should be 'If'."); // narrowing TS typing
  expect(result.metaTemplate.props["frog"].required).toBe(true);
});

test("Optional true", () => {
  const result = callMetaTemplate(
    "mt-if-optional",
    `<mt-if optional test="frog !== 'frush'   ">hello</mt-if>`,
    "",
    true
  );
  const node = result.metaTemplate.nodes[0];
  expect(result.metaTemplate.nodes[0].type).toBe("If");
  if (node.type !== "If") throw Error("Should be 'If'."); // narrowing TS typing
  expect(result.metaTemplate.props["frog"].required).toBe(false);
});

test("Throws on syntax error with haltOnErrors=true", () => {
  expect(() => {
    callMetaTemplate(
      "mt-if",
      `<mt-if test="frog ================ 'frush'   ">hello</mt-if>`,
      "",
      true
    );
  }).toThrow();
});

test("Can gracefully handle syntax errors without throwing with haltOnErrors=false", () => {
  const result = callMetaTemplate(
    "mt-if",
    `<mt-if test="frog ================ 'frush'   ">hello</mt-if>`,
    "",
    false
  );
  const node = result.metaTemplate.nodes[0];
  expect(result.metaTemplate.nodes[0].type).toBe("If");
  if (node.type !== "If") throw Error("Should be 'If'."); // narrowing TS typing
  expect(node.parseError).toBe(true);
  if (node.parseError !== true) throw Error("Should be a parse error"); // narrowing TS typing
  expect(node.children.length).toBe(1);
});
