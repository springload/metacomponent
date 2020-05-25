import React from "react";
import { render } from "@testing-library/react";
import App from "./App";
import MetaTemplate from "./lib";
import jsdom from "jsdom";

test("renders learn react link", () => {
  const { getByText } = render(<App />);
  const linkElement = getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});

test("rnk", async () => {
  const { JSDOM } = jsdom;
  const window = new JSDOM(``, { pretendToBeVisual: true }).window;
  console.log("before");
  const files = await MetaTemplate(
    // @ts-ignore
    window,
    "paragraph",
    "<p>hello</p>",
    "p { color: red } .treeShake { background: blue} "
  );
  console.log("after");
  console.log({ files });
  expect("dsf").toEqual("sds");
});
