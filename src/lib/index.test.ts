import metaTemplate from "./index";
import jsdom from "jsdom";

test("Can render without errors", () => {
  const result = callMetaTemplate(
    "paragraph",
    "<p>hello</p>",
    "p { color: red }"
  );
  expect(Object.values(result.files).length).toBeGreaterThan(0);
});

test("Can tree shake", () => {
  const result = callMetaTemplate(
    "paragraph",
    "<p>hello</p>",
    "p { color: red } .treeShake { background: blue} "
  );
  const filesString = JSON.stringify(result.files);
  expect(filesString.includes("treeShake")).toBeFalsy();
});

test("Can associate by class name", () => {
  // .frog { color: red } .penguin { color: blue}
  const result = callMetaTemplate(
    "paragraph",
    `<p class="frog">hello</p>`,
    ".frog { color: blue } .tree-shake { background: yellow } "
  );
  const filesString = JSON.stringify(result, null, 2);
  console.log(filesString);
  expect(filesString.includes(".frog")).toBeTruthy();
  expect(filesString.includes(".tree-shake")).toBeFalsy();
});

function callMetaTemplate(
  templateId: string,
  metaHTML: string,
  css: string
): ReturnType<typeof metaTemplate> {
  const { JSDOM } = jsdom;
  const jsdomInstance = new JSDOM(``, { pretendToBeVisual: true });
  const result = metaTemplate(
    // @ts-ignore
    jsdomInstance.window,
    templateId,
    metaHTML,
    css
  );
  jsdomInstance.window.close();
  return result;
}
