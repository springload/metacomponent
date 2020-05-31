import React, { useState, useRef, useEffect } from "react";
import { generateTemplates, MetaTemplates } from "./lib";
import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/mode-html";
import "ace-builds/src-noconflict/mode-css";
import "ace-builds/src-noconflict/theme-monokai";
import "./App.css";

const theme = "monokai";

const defaultValues = {
  metaHTML: `<p class="my-style">test <mt-variable id="my-id"> things </p>`,
  css: `.my-style { background: red; }\n.treeShake { color: green; }`,
};

function App() {
  const [metaHTML, setMetaHTML] = useState<string>(defaultValues.metaHTML);
  const [css, setCSS] = useState<string>(defaultValues.css);
  const [metaTemplates, setMetaTemplates] = useState<MetaTemplates>();
  const [resultIndex, setResultIndex] = useState(0);
  const [debounceTime, setDebounceTime] = useState(100);
  const iframeRef = useRef(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      const iframeEl: HTMLIFrameElement | null = iframeRef.current;
      if (!iframeEl) {
        return;
      }
      // @ts-ignore
      const domDocument = iframeEl.contentWindow?.document;
      if (!domDocument) {
        return;
      }
      const startTime = Date.now();
      const result = generateTemplates({
        domDocument,
        templateId: "myTemplateId",
        metaHTMLString: metaHTML,
        cssString: css,
        haltOnErrors: false,
      });
      const endTime = Date.now();
      let newDebounceTime = endTime - startTime;
      newDebounceTime = newDebounceTime < 15 ? 15 : newDebounceTime;
      setDebounceTime(newDebounceTime);
      setMetaTemplates(result);
    }, debounceTime);
    return () => clearTimeout(handler);
  }, [debounceTime, metaHTML, css]);

  const filePaths = metaTemplates ? Object.keys(metaTemplates.files) : [];

  const outputValue = metaTemplates
    ? resultIndex === 0
      ? JSON.stringify(metaTemplates, null, 2)
      : filePaths[resultIndex - 1]
      ? metaTemplates.files[filePaths[resultIndex - 1]]
      : ""
    : "";

  const outputMode =
    resultIndex === 0 ? "json" : pathType(filePaths[resultIndex - 1]);

  return (
    <div className="MetaTemplateDemo">
      <h1 className="title_container">MetaTemplate REPL</h1>
      <fieldset className="html_container">
        <legend>MetaHTML</legend>
        <AceEditor
          mode="html"
          theme={theme}
          onChange={(val) => setMetaHTML(val)}
          name="html"
          value={metaHTML}
          width="100%"
          height="100%"
        />
      </fieldset>

      <fieldset className="css_container">
        <legend>CSS</legend>
        <AceEditor
          mode="css"
          theme={theme}
          onChange={(val) => setCSS(val)}
          name="css"
          value={css}
          width="100%"
          height="100%"
        />
      </fieldset>

      <iframe
        id="iframe"
        src="./iframe.html"
        className="iframe_container"
        title="MetaTemplate iframe"
        ref={iframeRef}
      ></iframe>

      <fieldset className="output_container">
        <legend>
          Output &nbsp;
          <button
            role="tab"
            aria-selected={resultIndex === 0}
            className={`tab ${resultIndex === 0 ? "tab--selected" : undefined}`}
            aria-controls="output"
            id="tab-0"
            onClick={(e) => {
              setResultIndex(0);
            }}
          >
            Everything
          </button>
          {metaTemplates
            ? Object.keys(metaTemplates.files).map((file, fileIndex) => (
                <button
                  role="tab"
                  aria-selected={resultIndex === fileIndex + 1}
                  className={`tab ${
                    resultIndex === fileIndex + 1 ? "tab--selected" : undefined
                  }`}
                  aria-controls="output"
                  id={`tab-${fileIndex + 1}`}
                  onClick={(e) => {
                    setResultIndex(fileIndex + 1);
                  }}
                >
                  {pathType(file)}
                </button>
              ))
            : null}
        </legend>

        <AceEditor
          mode={outputMode}
          theme={theme}
          name="output"
          value={outputValue}
          readOnly
          width="100%"
          height="100%"
          showGutter={false}
        />
      </fieldset>
    </div>
  );
}

function pathType(file: string) {
  return file.substring(0, file.indexOf("/"));
}

export default App;
