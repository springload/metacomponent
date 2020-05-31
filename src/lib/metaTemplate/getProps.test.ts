import { callMetaTemplate } from "../testHelpers";

test("Parsing document with mt-variable should generate props", () => {
  const result = callMetaTemplate(
    "mt-variable-makes-props",
    `<mt-variable id="someId"><p>stuff</p>`,
    "",
    true
  );
  expect(Object.keys(result.metaTemplate.props).length).toBe(1);
  expect(result.metaTemplate.props["someId"]).toEqual({
    required: true,
    type: "PropTypeValue",
  });
});

test("Parsing document with mt-variable should generate optional props", () => {
  const result = callMetaTemplate(
    "mt-variable-makes-props",
    `<mt-variable id="someId" optional><p>stuff</p>`,
    "",
    true
  );
  expect(Object.keys(result.metaTemplate.props).length).toBe(1);
  expect(result.metaTemplate.props["someId"]).toEqual({
    required: false,
    type: "PropTypeValue",
  });
});

test("Parsing document with mt-if should generate props", () => {
  const result = callMetaTemplate(
    "mt-variable-makes-props",
    `<mt-if test="aThing"><p>stuff</p></mt-if>`,
    "",
    true
  );
  expect(Object.keys(result.metaTemplate.props).length).toBe(1);
  expect(result.metaTemplate.props["aThing"]).toEqual({
    required: true,
    type: "PropTypeValue",
  });
});

test("Parsing document with mt-if should generate props", () => {
  const result = callMetaTemplate(
    "mt-variable-makes-props",
    `<mt-if test="aThing" optional><p>stuff</p></mt-if>`,
    "",
    true
  );
  expect(Object.keys(result.metaTemplate.props).length).toBe(1);
  expect(result.metaTemplate.props["aThing"]).toEqual({
    required: false,
    type: "PropTypeValue",
  });
});

// TODO: decide whether to support legacy syntax..probably not
// test("Parsing document with mt-if should generate props", () => {
//   const result = callMetaTemplate(
//     "mt-variable-makes-props",
//     `<mt-if test="aThing?"><p>stuff</p></mt-if>`,
//     "",
//     true
//   );
//   console.log(JSON.stringify(result, null, 2));
//   expect(Object.keys(result.metaTemplate.props).length).toBe(1);
//   expect(result.metaTemplate.props["aThing"]).toEqual({
//     required: false,
//     type: "PropTypeValue",
//   });
// });
