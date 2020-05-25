import React, { useEffect } from "react";
import metaTemplate from "./lib";
import "./App.css";

const defaultValues = {
  html: `<p class="para">test</p>`,
  css: `.para { background: red; }\n .treeShake { color: green; }`,
};

function App() {
  useEffect(() => {
    // @ts-ignore
    const htmlEl: HTMLTextAreaElement = document.getElementById("html");
    // @ts-ignore
    const cssEl: HTMLTextAreaElement = document.getElementById("css");
    // @ts-ignore
    const iframeEl: HTMLIFrameElement = document.getElementById("iframe");
    // @ts-ignore
    const outputEl: HTMLTextAreaElement = document.getElementById("output");
    if (!htmlEl || !cssEl || !iframeEl || !outputEl)
      throw Error("Can't find elements.");
    htmlEl.value = defaultValues.html;
    cssEl.value = defaultValues.css;
    document.getElementById("makeTemplates")?.addEventListener("click", () => {
      const document = iframeEl.contentWindow?.document;
      if (!document) throw Error("Unable to find iframe window's document");
      const result = metaTemplate(
        document,
        "myTemplateId",
        htmlEl.value,
        cssEl.value
      );
      outputEl.value = JSON.stringify(result, null, 2);
    });
  }, []);
  return (
    <div className="MetaTemplateDemo">
      <fieldset className="html_container">
        <legend>HTML</legend>
        <textarea id="html"></textarea>
      </fieldset>

      <fieldset className="css_container">
        <legend>CSS</legend>
        <textarea id="css" />
      </fieldset>

      <button id="makeTemplates" className="makeTemplates_container">
        Make Templates
      </button>

      <iframe
        id="iframe"
        src="./iframe.html"
        className="iframe_container"
      ></iframe>

      <fieldset className="output_container">
        <legend>Output</legend>
        <textarea id="output" />
      </fieldset>
    </div>
  );
}

export default App;
