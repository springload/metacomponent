import React, { Fragment, useState, useRef, useEffect } from "react";
import marked from "marked";
import Modal from "react-modal";
import { generateTemplates, MetaComponents } from "./lib";
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

const modalStyles = {
  overlay: {
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 10,
    border: "none",
  },
  content: {
    background: "none",
    inset: "0px",
    border: "none",
  },
} as const;
Modal.setAppElement("#root");

function App() {
  const [metaHTML, setMetaHTML] = useState<string>(defaultValues.metaHTML);
  const [css, setCSS] = useState<string>(defaultValues.css);
  const [metaComponents, setMetaComponents] = useState<MetaComponents>();
  const [resultIndex, setResultIndex] = useState<number>(
    defaultValues.resultIndex
  );
  const [isWhatOpen, setIsWhatOpen] = useState<boolean>(false);
  const [isWhyOpen, setIsWhyOpen] = useState<boolean>(false);
  const debounceTime = useRef<number>(100);
  const iframeRef = useRef(null);

  const openWhatModal = () => setIsWhatOpen(true);
  const closeWhatModal = () => setIsWhatOpen(false);

  const openWhyModal = () => setIsWhyOpen(true);
  const closeWhyModal = () => setIsWhyOpen(false);

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
      console.log(`Debouncing calling MetaComponent at ${newDebounceTime}ms`);
      debounceTime.current = newDebounceTime;
      setMetaComponents(result);
    }, debounceTime.current);
    return () => clearTimeout(handler);
  }, [metaHTML, css]);

  const filePaths = metaComponents ? Object.keys(metaComponents.files) : [];

  const outputValue = metaComponents
    ? resultIndex === 0
      ? JSON.stringify(metaComponents, null, 2)
      : filePaths[resultIndex - 1]
      ? metaComponents.files[filePaths[resultIndex - 1]]
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
    <Fragment>
      <Modal
        isOpen={isWhatOpen}
        onRequestClose={closeWhatModal}
        style={modalStyles}
        contentLabel="What is MetaHTML?"
        shouldCloseOnOverlayClick={true}
      >
        <div className="modal-content" onClick={closeWhatModal} id="what-modal">
          <div
            className="modal-content__body"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={closeWhatModal} className="close_button">
              close <span aria-hidden> ✘</span>
            </button>
            <div dangerouslySetInnerHTML={{ __html: whatIsMetaHTML }}></div>
            <button onClick={closeWhatModal} className="close_button">
              close <span aria-hidden> ✘</span>
            </button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={isWhyOpen}
        onRequestClose={closeWhyModal}
        style={modalStyles}
        contentLabel="Why is MetaComponent?"
        shouldCloseOnOverlayClick={true}
      >
        <div className="modal-content" onClick={closeWhatModal} id="why-modal">
          <div
            className="modal-content__body"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={closeWhyModal} className="close_button">
              close <span aria-hidden> ✘</span>
            </button>
            <div dangerouslySetInnerHTML={{ __html: whyIsMetaComponent }}></div>

            <button onClick={closeWhyModal} className="close_button">
              close <span aria-hidden> ✘</span>
            </button>
          </div>
        </div>
      </Modal>
      <div className="MetaComponentDemo">
        <div id="button_tray_container" className="button-tray">
          <button
            onClick={openWhyModal}
            className="button-tray__link"
            aria-expanded={isWhyOpen}
            aria-controls="why-modal"
          >
            Why MetaComponent?
          </button>
          <a
            href="https://github.com/springload/metacomponent"
            target="_blank"
            rel="noreferrer noopener"
            className="button-tray__link"
          >
            repo
          </a>
        </div>
        <h1 className="title_container">MetaComponent REPL </h1>
        <fieldset className="html_container">
          <legend>
            MetaHTML
            <button
              onClick={openWhatModal}
              className="what-button"
              aria-label="Why MetaHTML?"
              aria-expanded={isWhatOpen}
              aria-controls="what-modal"
            >
              ?
            </button>
          </legend>
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
            showGutter={false}
            showPrintMargin={false}
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
            showGutter={false}
            showPrintMargin={false}
          />
        </fieldset>

        <iframe
          id="iframe"
          src="./iframe.html"
          className="iframe_container"
          title="MetaComponent iframe"
          ref={iframeRef}
        ></iframe>

        <fieldset className="output_container">
          <legend>
            Output &nbsp;
            <button
              role="tab"
              aria-selected={resultIndex === 0}
              className={`tab ${
                resultIndex === 0 ? "tab--selected" : undefined
              }`}
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
            {metaComponents
              ? Object.keys(metaComponents.files).map((file, fileIndex) => (
                  <button
                    role="tab"
                    aria-selected={resultIndex === fileIndex + 1}
                    className={`tab ${
                      resultIndex === fileIndex + 1
                        ? "tab--selected"
                        : undefined
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
            showPrintMargin={false}
            showGutter={false}
            markers={markers}
          />
        </fieldset>
      </div>
    </Fragment>
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

const whatIsMetaHTML = marked(`
## MetaHTML ?

The reason we need non-standard HTML is to mark which parts should be configurable, as variables.

MetaHTML is standard HTML with two types of variables, for attributes and elements:

- attributes:
  - \`<span class="{{ someVariable }}">\`
    - \`?\` makes it optional \`{{ someVariable? }}\`.
    - multiple variables \`<span class="{{ class }}{{ otherClass }}">\`
  - enumerations like \`{{ variableName: option1 | option2 }}\` eg \`<span class="{{ color: class-red | class-blue }}">\` and MetaComponent will generate React TypeScript to require that option.
  - label enumerations with friendly names with \`as FriendlyName\` eg  \`{{ variableName: box--color-red as Red | box--color-blue as Blue }}\`. Enumerations may only be strings.
- elements:
  - \`<mt-variable id="variableName">\` eg \`<div><mt-variable key="children"></div>\`
  - conditional logic \`<mt-if test="isShown">thing to show</mt-if>\`. JavaScript expressions are supported and normalized. It should be possible to convert basic JavaScript expressions into equivalents in other languages.

MetaHTML is for generating stateless components, just the HTML and CSS. Logic should be in a higher-order components (HOC).

MetaComponent is for _the very front of the front-end_
`);

const whyIsMetaComponent = marked(`
## Why MetaComponent?

It's often the case that large organisations and governments, for a variety of reasons, have a large variety of web template technology.

They use React, Vue, Angular, Handlebars, Jinja2, Twig, and many, many more.

As a result, websites feel quite different.

If you wanted to unify that behaviour and appearance (HTML and CSS) an obvious answer is Design Systems (and Pattern Libraries) where you'd publish advice, and components.

It would be a lot of manual work to support all of those web frameworks, and so typically Design Systems choose HTML/CSS and only one additional component format that they write manually by hand.

Essentially they declare one format the winner: Angular, React, Vue, Handlebars, or Nunjucks., and technology stacks that don't support that format are left to fend for themselves by implementing the HTML/CSS manually by hand.

Design Systems often solves one problem (standardising HTML/CSS) while creating new technical barriers that may hinder adoption.

If you consider situations like governments or large organisations with many different technology stacks, it may not be practical to converge template formats, or there might be good reasons for divergence.

MetaComponent tries to complement Design Systems by generating components for many frameworks to make it easiser to adopt.

MetaComponent is for _the very front of the front-end_
`);
