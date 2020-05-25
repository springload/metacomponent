import React, { useEffect } from "react";
import metaTemplate from "./lib";
import "./App.css";

const defaultValues = {
  html: `<p class="my-style">test</p>`,
  css: `.my-style { background: red; }\n .treeShake { color: green; }`,
};

function App() {
  useEffect(() => {
    // @ts-ignore
    const metaHtmlEl: HTMLTextAreaElement = document.getElementById("metaHtml");
    // @ts-ignore
    const cssEl: HTMLTextAreaElement = document.getElementById("css");
    // @ts-ignore
    const iframeEl: HTMLIFrameElement = document.getElementById("iframe");
    // @ts-ignore
    const outputEl: HTMLTextAreaElement = document.getElementById("output");
    if (!metaHtmlEl || !cssEl || !iframeEl || !outputEl)
      throw Error("Can't find elements.");
    metaHtmlEl.value = defaultValues.html;
    cssEl.value = defaultValues.css;
    const rebuild = () => {
      const document = iframeEl.contentWindow?.document;
      if (!document) throw Error("Unable to find iframe window's document");
      const result = metaTemplate(
        document,
        "myTemplateId",
        metaHtmlEl.value,
        cssEl.value
      );
      outputEl.value = JSON.stringify(result, null, 2);
    };

    metaHtmlEl.addEventListener("change", rebuild, false);
    metaHtmlEl.addEventListener("keyup", rebuild, false);

    cssEl.addEventListener("change", rebuild, false);
    cssEl.addEventListener("keyup", rebuild, false);

    rebuild();
  }, []);
  return (
    <div className="MetaTemplateDemo">
      <fieldset className="html_container">
        <legend>MetaHTML</legend>
        <textarea id="metaHtml"></textarea>
      </fieldset>

      <fieldset className="css_container">
        <legend>CSS</legend>
        <textarea id="css" />
      </fieldset>

      <iframe
        id="iframe"
        src="./iframe.html"
        className="iframe_container"
      ></iframe>

      <fieldset className="output_container">
        <legend>Output</legend>
        <textarea id="output" readOnly />
      </fieldset>
    </div>
  );
}

export default App;
