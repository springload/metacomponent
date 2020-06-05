import { callMetaComponent } from "../testHelpers";

test("Parsing document with mt-variable should generate props", () => {
  const result = callMetaComponent(
    "mt-variable-makes-props",
    `<mt-variable id="someId"><p>stuff</p>`,
    "",
    true
  );
  expect(Object.keys(result.metaComponent.props).length).toBe(1);
  expect(result.metaComponent.props["someId"]).toEqual({
    required: true,
    type: "PropTypeVariable",
  });
});

test("Parsing document with mt-variable inside mt-if should generate props", () => {
  const result = callMetaComponent(
    "mt-variable-makes-props",
    `<mt-if test="a=b"><mt-variable id="someId"></mt-if><p>stuff</p>`,
    "",
    true
  );

  expect(Object.keys(result.metaComponent.props).length).toBe(3);
  expect(result.metaComponent.props["someId"]).toEqual({
    required: true,
    type: "PropTypeVariable",
  });
});

test("Parsing document with mt-variable should generate optional props", () => {
  const result = callMetaComponent(
    "mt-variable-makes-props",
    `<mt-variable id="someId" optional><p>stuff</p>`,
    "",
    true
  );
  expect(Object.keys(result.metaComponent.props).length).toBe(1);
  expect(result.metaComponent.props["someId"]).toEqual({
    required: false,
    type: "PropTypeVariable",
  });
});

test("Parsing document with mt-if should generate props", () => {
  const result = callMetaComponent(
    "mt-variable-makes-props",
    `<mt-if test="aThing"><p>stuff</p></mt-if>`,
    "",
    true
  );
  expect(Object.keys(result.metaComponent.props).length).toBe(1);
  expect(result.metaComponent.props["aThing"]).toEqual({
    required: true,
    type: "PropTypeVariable",
  });
});

test("Parsing document with mt-if should generate props", () => {
  const result = callMetaComponent(
    "mt-variable-makes-props",
    `<mt-if test="aThing" optional><p>stuff</p></mt-if>`,
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
    "mt-variable-makes-props",
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
    "mt-variable-makes-props",
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
    "mt-variable-makes-props",
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
    "mt-variable-makes-props",
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
    "mt-variable-makes-props",
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
    "mt-variable-makes-props",
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
    "mt-variable-makes-props",
    `<a href="{{ href?: http://zombo.com/ as Zombo | https://holloway.nz as Holloway }}">thing</a><mt-if test="href">a thing</mt-if>`,
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
    "mt-variable-makes-props",
    `<a href="{{ href: http://zombo.com/ as Zombo | https://holloway.nz as Holloway }}">thing</a><mt-if test="href">a thing</mt-if>`,
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
    "mt-variable-makes-props",
    `<a href="{{ href: http://zombo.com/ as Zombo | https://holloway.nz as Holloway }}" aria-hidden="{{ href }}">thing</a><mt-if test="href">a thing</mt-if>`,
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
// test("Parsing document with mt-if should generate props", () => {
//   const result = callMetaComponent(
//     "mt-variable-makes-props",
//     `<mt-if test="aThing?"><p>stuff</p></mt-if>`,
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
