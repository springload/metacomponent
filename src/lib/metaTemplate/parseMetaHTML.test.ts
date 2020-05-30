import { callMetaTemplate } from "../testHelpers";

test("Can arrange child nodes under mt-variable to be siblings", () => {
  const result = callMetaTemplate(
    "mt-variable-cant-children",
    `<mt-variable id="someId"><p>stuff</p>`,
    "",
    true
  );
  console.log(JSON.stringify(result.metaTemplate.nodes, null, 2));
  expect(result.metaTemplate.nodes.length).toBe(2);
});

test("Can rearrange child nodes under mt-variable to be siblings in the correct order", () => {
  const result = callMetaTemplate(
    "mt-variable-cant-children",
    `<mt-variable id="someId"><p>stuff</p><div>stuff</div>`,
    "",
    true
  );
  console.log(JSON.stringify(result.metaTemplate.nodes, null, 2));
  expect(result.metaTemplate.nodes.length).toBe(3);
  expect(result.metaTemplate.nodes[0].type).toBe("Variable");
  const firstElement = result.metaTemplate.nodes[1];
  const secondElement = result.metaTemplate.nodes[2];

  expect(firstElement.type).toBe("Element");
  expect(secondElement.type).toBe("Element");
  if (firstElement.type !== "Element" || secondElement.type !== "Element") {
    // TS narrowing
    throw Error("Expected both to be elements");
  }
  expect(firstElement.nodeName).toBe("p");
  expect(secondElement.nodeName).toBe("div");
});
