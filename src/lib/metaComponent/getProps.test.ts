import { callMetaComponent } from "../testHelpers";

test("Parsing document with m-variable should generate props", () => {
  const result = callMetaComponent(
    "m-variable-makes-props",
    `<m-variable id="someId"><p>stuff</p>`,
    "",
    true
  );
  expect(Object.keys(result.metaComponent.props).length).toBe(1);
  expect(result.metaComponent.props["someId"]).toEqual({
    required: true,
    type: "PropTypeVariable",
  });
});

test("Parsing document with m-variable inside m-if should generate props", () => {
  const result = callMetaComponent(
    "m-variable-makes-props",
    `<m-if test="a==b"><m-variable id="someId"></m-if><p>stuff</p>`,
    "",
    true
  );

  expect(Object.keys(result.metaComponent.props).length).toBe(3);
  expect(result.metaComponent.props["someId"]).toEqual({
    required: true,
    type: "PropTypeVariable",
  });
});

test("Parsing document with m-variable should generate optional props", () => {
  const result = callMetaComponent(
    "m-variable-makes-props",
    `<m-variable id="someId" optional><p>stuff</p>`,
    "",
    true
  );
  expect(Object.keys(result.metaComponent.props).length).toBe(1);
  expect(result.metaComponent.props["someId"]).toEqual({
    required: false,
    type: "PropTypeVariable",
  });
});

test("Parsing document with m-if should generate props", () => {
  const result = callMetaComponent(
    "m-variable-makes-props",
    `<m-if test="aThing"><p>stuff</p></m-if>`,
    "",
    true
  );
  expect(Object.keys(result.metaComponent.props).length).toBe(1);
  expect(result.metaComponent.props["aThing"]).toEqual({
    required: true,
    type: "PropTypeVariable",
  });
});

test("Parsing document with m-if should generate props", () => {
  const result = callMetaComponent(
    "m-variable-makes-props",
    `<m-if test="aThing" optional><p>stuff</p></m-if>`,
    "",
    true
  );
  expect(Object.keys(result.metaComponent.props).length).toBe(1);
  expect(result.metaComponent.props["aThing"]).toEqual({
    required: false,
    type: "PropTypeVariable",
  });
});

test("Parsing document with attribute props that are required", () => {
  const result = callMetaComponent(
    "m-variable-makes-props",
    `<a href="{{ href }}">thing</a>`,
    "",
    true
  );
  expect(Object.keys(result.metaComponent.props).length).toBe(1);
  expect(result.metaComponent.props["href"]).toEqual({
    type: "PropTypeAttributeValue",
    attributeName: "href",
    nodeName: "a",
    required: true,
  });
});

test("Parsing document with attribute props that are optional", () => {
  const result = callMetaComponent(
    "m-variable-makes-props",
    `<a href="{{ href? }}">thing</a>`,
    "",
    true
  );
  expect(Object.keys(result.metaComponent.props).length).toBe(1);
  expect(result.metaComponent.props["href"]).toEqual({
    type: "PropTypeAttributeValue",
    attributeName: "href",
    nodeName: "a",
    required: false,
  });
});

test("Parsing document with attribute props that are options, without 'as' nice names", () => {
  const result = callMetaComponent(
    "m-variable-makes-props",
    `<a href="{{ href: http://zombo.com/ }}">thing</a>`,
    "",
    true
  );
  expect(Object.keys(result.metaComponent.props).length).toBe(1);
  expect(result.metaComponent.props["href"]).toEqual({
    type: "PropTypeAttributeValueOptions",
    attributeName: "href",
    nodeName: "a",
    required: true,
    options: {
      "http://zombo.com/": "http://zombo.com/",
    },
  });
});

test("Parsing document with attribute props that are options, with 'as' nice names", () => {
  const result = callMetaComponent(
    "m-variable-makes-props",
    `<a href="{{ href: http://zombo.com/ as Zombo }}">thing</a>`,
    "",
    true
  );
  expect(Object.keys(result.metaComponent.props).length).toBe(1);
  expect(result.metaComponent.props["href"]).toEqual({
    type: "PropTypeAttributeValueOptions",
    attributeName: "href",
    nodeName: "a",
    required: true,
    options: {
      Zombo: "http://zombo.com/",
    },
  });
});

test("Parsing document with attribute props that are multiple options, with 'as' nice names", () => {
  const result = callMetaComponent(
    "m-variable-makes-props",
    `<a href="{{ href: http://zombo.com/ as Zombo | https://holloway.nz as Holloway }}">thing</a>`,
    "",
    true
  );
  expect(Object.keys(result.metaComponent.props).length).toBe(1);
  expect(result.metaComponent.props["href"]).toEqual({
    type: "PropTypeAttributeValueOptions",
    attributeName: "href",
    nodeName: "a",
    required: true,
    options: {
      Zombo: "http://zombo.com/",
      Holloway: "https://holloway.nz",
    },
  });
});

test("Parsing document with attribute props that are optional, with multiple options, with 'as' nice names", () => {
  const result = callMetaComponent(
    "m-variable-makes-props",
    `<a href="{{ href?: http://zombo.com/ as Zombo | https://holloway.nz as Holloway }}">thing</a>`,
    "",
    true
  );
  expect(Object.keys(result.metaComponent.props).length).toBe(1);
  expect(result.metaComponent.props["href"]).toEqual({
    type: "PropTypeAttributeValueOptions",
    attributeName: "href",
    nodeName: "a",
    required: false,
    options: {
      Zombo: "http://zombo.com/",
      Holloway: "https://holloway.nz",
    },
  });
});

test("Props with same id are prioritised", () => {
  const result = callMetaComponent(
    "m-variable-makes-props",
    `<a href="{{ href?: http://zombo.com/ as Zombo | https://holloway.nz as Holloway }}">thing</a><m-if test="href">a thing</m-if>`,
    "",
    true
  );
  expect(Object.keys(result.metaComponent.props).length).toBe(1);
  expect(result.metaComponent.props["href"]).toEqual({
    type: "PropTypeAttributeValueOptions",
    attributeName: "href",
    nodeName: "a",
    required: false,
    options: {
      Zombo: "http://zombo.com/",
      Holloway: "https://holloway.nz",
    },
  });
});

test("Props with same id are prioritised, and have correct required status", () => {
  const result = callMetaComponent(
    "m-variable-makes-props",
    `<a href="{{ href: http://zombo.com/ as Zombo | https://holloway.nz as Holloway }}">thing</a><m-if test="href">a thing</m-if>`,
    "",
    true
  );
  expect(Object.keys(result.metaComponent.props).length).toBe(1);
  expect(result.metaComponent.props["href"]).toEqual({
    type: "PropTypeAttributeValueOptions",
    attributeName: "href",
    nodeName: "a",
    required: true,
    options: {
      Zombo: "http://zombo.com/",
      Holloway: "https://holloway.nz",
    },
  });
});

test("Props with same id are prioritised, and have correct required status", () => {
  const result = callMetaComponent(
    "m-variable-makes-props",
    `<a href="{{ href: http://zombo.com/ as Zombo | https://holloway.nz as Holloway }}" aria-hidden="{{ href }}">thing</a><m-if test="href">a thing</m-if>`,
    "",
    true
  );
  expect(Object.keys(result.metaComponent.props).length).toBe(1);
  expect(result.metaComponent.props["href"]).toEqual({
    type: "PropTypeAttributeValueOptions",
    attributeName: "href",
    nodeName: "a",
    required: true,
    options: {
      Zombo: "http://zombo.com/",
      Holloway: "https://holloway.nz",
    },
  });
});

// TODO: decide whether to support legacy syntax..probably not
// probably better to provide upgrade advice
//
// test("Parsing document with m-if should generate props", () => {
//   const result = callMetaComponent(
//     "m-variable-makes-props",
//     `<m-if test="aThing?"><p>stuff</p></m-if>`,
//     "",
//     true
//   );
//   console.log(JSON.stringify(result, null, 2));
//   expect(Object.keys(result.metaComponent.props).length).toBe(1);
//   expect(result.metaComponent.props["aThing"]).toEqual({
//     required: false,
//     type: "PropTypeVariable",
//   });
// });
