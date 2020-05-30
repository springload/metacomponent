import { callMetaTemplate } from "../testHelpers";

test("MetaAttribute", () => {
  const result = callMetaTemplate(
    "meta attribute",
    `<p class="thing"/>`,
    "",
    true
  );
  const node = result.metaTemplate.nodes[0];
  expect(result.metaTemplate.nodes[0].type).toBe("Element");
  if (node.type !== "Element") throw Error("Should be 'Element'."); // narrowing TS typing
  const classAttribute = node.attributes.class;
  expect(classAttribute).toBeTruthy();
  expect(classAttribute.length).toBe(1);
  expect(classAttribute[0].type).toBe("MetaAttributeConstant");
});
