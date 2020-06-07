import { callMetaComponent } from "../testHelpers";

test("mt-if doesn't interfere with css string", () => {
  const result = callMetaComponent(
    "mt-if-css",
    `<mt-if test="bob === 'frog'"><h1 class="my-style"><mt-variable id="children"></mt-variable></h1></mt-if>`,
    ".my-style { color: blue; }",
    true
  );
  expect(result.metaComponent.cssString.length).toBeGreaterThan(20);
});
