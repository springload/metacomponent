import { callMetaComponent } from "../testHelpers";

test("Parsing document with mt-variable should rearrange chid nodes to be siblings", () => {
  const result = callMetaComponent(
    "mt-variable-cant-children",
    `<mt-variable id="someId"><p>stuff</p>`,
    "",
    true
  );
  expect(result.metaComponent.nodes.length).toBe(2);
});

test("Parsing document with mt-variable should rearrange chid nodes to be siblings in the correct order", () => {
  const result = callMetaComponent(
    "mt-variable-cant-children",
    `<mt-variable id="someId"><p>stuff</p><div>stuff</div>`,
    "",
    true
  );
  expect(result.metaComponent.nodes.length).toBe(3);
  expect(result.metaComponent.nodes[0].type).toBe("Variable");
  const firstElement = result.metaComponent.nodes[1];
  const secondElement = result.metaComponent.nodes[2];
  expect(firstElement.type).toBe("Element");
  expect(secondElement.type).toBe("Element");
  if (firstElement.type !== "Element" || secondElement.type !== "Element") {
    // TS narrowing
    throw Error("Expected both to be elements");
  }
  expect(firstElement.nodeName).toBe("p");
  expect(secondElement.nodeName).toBe("div");
});
