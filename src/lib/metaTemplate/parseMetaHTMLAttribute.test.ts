import { callMetaTemplate } from "../testHelpers";

test("MetaAttribute with constant", () => {
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

test("MetaAttribute with constant and variable", () => {
  const result = callMetaTemplate(
    "meta attribute",
    `<p class="thing {{ frogs }}"/>`,
    "",
    true
  );
  const node = result.metaTemplate.nodes[0];
  expect(result.metaTemplate.nodes[0].type).toBe("Element");
  if (node.type !== "Element") throw Error("Should be 'Element'."); // narrowing TS typing
  const classAttribute = node.attributes.class;
  expect(classAttribute).toBeTruthy();
  expect(classAttribute.length).toBe(2);
  expect(classAttribute[0].type).toBe("MetaAttributeConstant");
  const index1 = classAttribute[1];
  expect(index1.type).toBe("MetaAttributeVariable");
  if (index1.type !== "MetaAttributeVariable") {
    // TS type narrowing
    throw Error(
      `Expected index1 to be "MetaAttributeVariable" was ${index1.type}`
    );
  }
  expect(index1.required).toBe(true);
  expect(index1.id).toBe("frogs");
});

test("MetaAttribute variable with incomplete options", () => {
  const result = callMetaTemplate(
    "meta attribute",
    `<p class="thing {{ frogs: }}"/>`,
    "",
    true
  );
  const node = result.metaTemplate.nodes[0];
  expect(result.metaTemplate.nodes[0].type).toBe("Element");
  if (node.type !== "Element") throw Error("Should be 'Element'."); // narrowing TS typing
  const classAttribute = node.attributes.class;
  expect(classAttribute).toBeTruthy();
  expect(classAttribute.length).toBe(2);
  expect(classAttribute[0].type).toBe("MetaAttributeConstant");
  const index1 = classAttribute[1];
  expect(index1.type).toBe("MetaAttributeVariableOptions");
  if (index1.type !== "MetaAttributeVariableOptions") {
    // TS type narrowing
    throw Error(
      `Expected index1 to be "MetaAttributeVariableOptions" was ${index1.type}`
    );
  }
  expect(index1.required).toBe(true);
  expect(index1.id).toBe("frogs");
  expect(Object.keys(index1.options).length).toBe(0);
});

test("MetaAttribute variable with option without 'as'", () => {
  const result = callMetaTemplate(
    "meta attribute",
    `<p class="thing {{ frogs: froggy }}"/>`,
    "",
    true
  );
  const node = result.metaTemplate.nodes[0];
  expect(result.metaTemplate.nodes[0].type).toBe("Element");
  if (node.type !== "Element") throw Error("Should be 'Element'."); // narrowing TS typing
  const classAttribute = node.attributes.class;
  expect(classAttribute).toBeTruthy();
  expect(classAttribute.length).toBe(2);
  expect(classAttribute[0].type).toBe("MetaAttributeConstant");
  const index1 = classAttribute[1];
  expect(index1.type).toBe("MetaAttributeVariableOptions");
  if (index1.type !== "MetaAttributeVariableOptions") {
    // TS type narrowing
    throw Error(
      `Expected index1 to be "MetaAttributeVariableOptions" was ${index1.type}`
    );
  }
  expect(index1.required).toBe(true);
  expect(index1.id).toBe("frogs");
  expect(Object.keys(index1.options).length).toBe(1);
  expect(index1.options).toHaveProperty("froggy");
  expect(index1.options["froggy"]).toEqual("froggy");
});

test("MetaAttribute variable with option with 'as'", () => {
  const result = callMetaTemplate(
    "meta attribute",
    `<p class="thing {{ frogs: froggy as Froggy }}"/>`,
    "",
    true
  );
  const node = result.metaTemplate.nodes[0];
  expect(result.metaTemplate.nodes[0].type).toBe("Element");
  if (node.type !== "Element") throw Error("Should be 'Element'."); // narrowing TS typing
  const classAttribute = node.attributes.class;
  expect(classAttribute).toBeTruthy();
  expect(classAttribute.length).toBe(2);
  expect(classAttribute[0].type).toBe("MetaAttributeConstant");
  const index1 = classAttribute[1];
  expect(index1.type).toBe("MetaAttributeVariableOptions");
  if (index1.type !== "MetaAttributeVariableOptions") {
    // TS type narrowing
    throw Error(
      `Expected index1 to be "MetaAttributeVariableOptions" was ${index1.type}`
    );
  }
  expect(index1.required).toBe(true);
  expect(index1.id).toBe("frogs");
  expect(Object.keys(index1.options).length).toBe(1);
  expect(index1.options).toHaveProperty("Froggy");
  expect(index1.options["Froggy"]).toEqual("froggy");
});

test("MetaAttribute variable with options with 'as'", () => {
  const result = callMetaTemplate(
    "meta attribute",
    `<p class="thing {{ frogs: froggy as Froggy | frush as Frush }}"/>`,
    "",
    true
  );
  const node = result.metaTemplate.nodes[0];
  expect(result.metaTemplate.nodes[0].type).toBe("Element");
  if (node.type !== "Element") throw Error("Should be 'Element'."); // narrowing TS typing
  const classAttribute = node.attributes.class;
  expect(classAttribute).toBeTruthy();
  expect(classAttribute.length).toBe(2);
  expect(classAttribute[0].type).toBe("MetaAttributeConstant");
  const index1 = classAttribute[1];
  expect(index1.type).toBe("MetaAttributeVariableOptions");
  if (index1.type !== "MetaAttributeVariableOptions") {
    // TS type narrowing
    throw Error(
      `Expected index1 to be "MetaAttributeVariableOptions" was ${index1.type}`
    );
  }
  expect(index1.required).toBe(true);
  expect(index1.id).toBe("frogs");
  expect(Object.keys(index1.options).length).toBe(2);
  expect(index1.options).toHaveProperty("Froggy");
  expect(index1.options["Froggy"]).toEqual("froggy");
  expect(index1.options).toHaveProperty("Frush");
  expect(index1.options["Frush"]).toEqual("frush");
});
