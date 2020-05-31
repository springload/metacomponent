import React, { useState, useRef, useEffect } from "react";
import { generateTemplates, MetaTemplates } from "./lib";
import "./App.css";

const defaultValues = {
  metaHTML: `<p class="my-style">test <mt-variable id="my-id"> things </p>`,
  css: `.my-style { background: red; }\n .treeShake { color: green; }`,
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

  return (
    <div className="MetaTemplateDemo">
      <h1 className="title_container">MetaTemplate REPL</h1>
      <fieldset className="html_container">
        <legend>MetaHTML</legend>
        <textarea
          id="metaHtml"
          value={metaHTML}
          onChange={(e) => setMetaHTML(e.target.value)}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        ></textarea>
      </fieldset>

      <fieldset className="css_container">
        <legend>CSS</legend>
        <textarea
          id="css"
          value={css}
          onChange={(e) => setCSS(e.target.value)}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
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
          Output{" "}
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
                  {file.substring(0, file.indexOf("/"))}
                </button>
              ))
            : null}
        </legend>
        <textarea
          id="output"
          value={outputValue}
          readOnly
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
      </fieldset>
    </div>
  );
}

export default App;
