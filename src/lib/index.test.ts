import { callMetaComponent } from "./testHelpers";

test("Can render without errors", () => {
  const result = callMetaComponent(
    "paragraph",
    "<p>hello</p>",
    "p { color: red }",
    false
  );
  expect(Object.values(result.files).length).toBeGreaterThan(0);
});

test("Can tree shake", () => {
  const result = callMetaComponent(
    "paragraph",
    "<p>hello</p>",
    "p { color: red } .treeShake { background: blue} ",
    false
  );
  const filesString = JSON.stringify(result.files);
  expect(filesString.includes("treeShake")).toBeFalsy();
});

test("Can associate by class name", () => {
  // .frog { color: red } .penguin { color: blue}
  const result = callMetaComponent(
    "paragraph",
    `<p class="frog">hello</p>`,
    ".frog { color: blue } .tree-shake { background: yellow } ",
    false
  );
  const filesString = JSON.stringify(result, null, 2);
  expect(filesString.includes(".frog")).toBeTruthy();
  expect(filesString.includes(".tree-shake")).toBeFalsy();
});
