import React, { useState, useRef, useEffect } from "react";
import { generateTemplates, MetaTemplates } from "./lib";
import { localStorageWrapper } from "./storage";
import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/mode-html";
import "ace-builds/src-noconflict/mode-css";
import "ace-builds/src-noconflict/theme-monokai";
import "./App.css";

const STORAGE_METAHTML = "STORAGE_METAHTML";
const STORAGE_CSS = "STORAGE_CSS";
const STORAGE_RESULT_INDEX = "STORAGE_RESULT_INDEX";

const oneFrameMs = 15;

const theme = "monokai";

const resultIndexString = localStorageWrapper.getItem(STORAGE_RESULT_INDEX);
const resultIndex = resultIndexString ? parseInt(resultIndexString, 10) : 0;

const defaultValues = {
  metaHTML:
    localStorageWrapper.getItem(STORAGE_METAHTML) ||
    `<h1\n  class="my-style {{ colour: my-style--blue as blue | my-style--red as red }}"\n>\n  <mt-variable id="children">\n</h1>`,
  css:
    localStorageWrapper.getItem(STORAGE_CSS) ||
    `.my-style { padding: 5px }\n.my-style--blue{ color: blue }\n.my-style--red{ color: red }\n/* this CSS isn't used and will be tree shaken */\n.treeShake { color: green; }`,
  resultIndex,
};

const templateId = "MyComponent";

function App() {
  const [metaHTML, setMetaHTML] = useState<string>(defaultValues.metaHTML);
  const [css, setCSS] = useState<string>(defaultValues.css);
  const [metaTemplates, setMetaTemplates] = useState<MetaTemplates>();
  const [resultIndex, setResultIndex] = useState<number>(
    defaultValues.resultIndex
  );
  const debounceTime = useRef<number>(100);
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
        templateId,
        metaHTMLString: metaHTML,
        cssString: css,
        haltOnErrors: false,
      });
      const endTime = Date.now();
      let newDebounceTime = endTime - startTime;
      newDebounceTime =
        newDebounceTime < oneFrameMs ? oneFrameMs : newDebounceTime;
      console.log(`Debouncing calling MetaTemplate at ${newDebounceTime}ms`);
      debounceTime.current = newDebounceTime;
      setMetaTemplates(result);
    }, debounceTime.current);
    return () => clearTimeout(handler);
  }, [metaHTML, css]);

  const filePaths = metaTemplates ? Object.keys(metaTemplates.files) : [];

  const outputValue = metaTemplates
    ? resultIndex === 0
      ? JSON.stringify(metaTemplates, null, 2)
      : filePaths[resultIndex - 1]
      ? metaTemplates.files[filePaths[resultIndex - 1]]
      : ""
    : "";

  const outputMode =
    resultIndex === 0
      ? "json"
      : filePaths[resultIndex - 1]
      ? aceMode(filePaths[resultIndex - 1])
      : "json";

  const markers = [];
  if (
    resultIndex > 0 &&
    filePaths[resultIndex - 1] &&
    pathType(filePaths[resultIndex - 1]).includes("react")
  ) {
    const templateIdIndex = outputValue.indexOf(templateId);
    const outputValueBefore = outputValue.substring(0, templateIdIndex);
    const rowIndex =
      outputValueBefore.length - outputValueBefore.replace(/\n/g, "").length;

    const startCol = outputValue.split("\n")[rowIndex].indexOf(templateId);

    markers.push({
      startRow: rowIndex,
      startCol,
      endRow: rowIndex,
      endCol: startCol + templateId.length - 1,
      className: "mt-tooltip",
      type: "text" as const,
      inFront: true,
    });
  }

  return (
    <div className="MetaTemplateDemo">
      <h1 className="title_container">MetaTemplate REPL</h1>
      <fieldset className="html_container">
        <legend>MetaHTML</legend>
        <AceEditor
          mode="html"
          theme={theme}
          onChange={(val) => {
            setMetaHTML(val);
            localStorageWrapper.setItem(STORAGE_METAHTML, val);
          }}
          name="html"
          value={metaHTML}
          width="100%"
          height="100%"
        />
      </fieldset>

      <fieldset className="css_container">
        <legend>Standard CSS</legend>
        <AceEditor
          mode="css"
          theme={theme}
          onChange={(val) => {
            setCSS(val);
            localStorageWrapper.setItem(STORAGE_CSS, val);
          }}
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
              const resultIndex = 0;
              setResultIndex(resultIndex);
              localStorageWrapper.setItem(
                STORAGE_RESULT_INDEX,
                resultIndex.toString()
              );
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
                    const resultIndex = fileIndex + 1;
                    setResultIndex(resultIndex);
                    localStorageWrapper.setItem(
                      STORAGE_RESULT_INDEX,
                      resultIndex.toString()
                    );
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
          markers={markers}
        />
      </fieldset>
    </div>
  );
}

function aceMode(file: string) {
  const dirname = file.substring(0, file.indexOf("/"));
  if (dirname === "react") {
    return "javascript";
  }
  return dirname;
}

function pathType(file: string) {
  return file.substring(0, file.indexOf("/"));
}

export default App;
