import { callMetaComponent } from "../testHelpers";

test("m-if doesn't interfere with css string", () => {
  const result = callMetaComponent(
    "m-if-css",
    `<m-if test="bob === 'frog'"><h1 class="my-style"><m-variable id="children"></m-variable></h1></m-if>`,
    ".my-style { color: blue; }",
    true
  );
  expect(result.metaComponent.cssString.length).toBeGreaterThan(20);
});
