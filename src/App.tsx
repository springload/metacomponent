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
  },
  content: {
    background: "none",
    inset: "0px",
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
  const [isWhyOpen, setIsWhyOpen] = useState<boolean>(true);
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
        <div className="modal-content" onClick={closeWhatModal}>
          <div
            className="modal-content__body"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={closeWhatModal} className="close_button">
              close ✘
            </button>
            <div dangerouslySetInnerHTML={{ __html: whatIsMetaHTML }}></div>
            <button onClick={closeWhatModal} className="close_button">
              close ✘
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
        <div className="modal-content" onClick={closeWhatModal}>
          <div
            className="modal-content__body"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={closeWhyModal} className="close_button">
              close ✘
            </button>
            <div dangerouslySetInnerHTML={{ __html: whyIsMetaComponent }}></div>
            <button onClick={closeWhyModal} className="close_button">
              close ✘
            </button>
          </div>
        </div>
      </Modal>
      <div className="MetaComponentDemo">
        <a
          href="https://github.com/springload/metacomponent"
          target="_blank"
          rel="noreferrer noopener"
          className="github-link"
        >
          repo
        </a>
        <h1 className="title_container">
          MetaComponent REPL{" "}
          <button onClick={openWhyModal} className="what-button">
            (Why MetaComponent?)
          </button>
        </h1>
        <fieldset className="html_container">
          <legend>
            MetaHTML
            <button onClick={openWhatModal} className="what-button">
              (Why MetaHTML?)
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

The reason why we need non-standard HTML is to mark which parts should be configurable, as variables.

MetaHTML is standard HTML with two types of variables, for attributes and elements:

- attributes:
  - For making a required variable string write \`{{ variableName }}\` eg \`<span class="{{ class }}">\`
    - Use a \`?\` after the variable name to make it optional \`{{ someVariable? }}\`.
    - Multiple variables can exist in an attribute value, write them like \`<span class="{{ class }}{{ otherClass }}">\`
  - You can make enumerations like \`{{ variableName:
    option1 | option2
  }}\` eg \`<span class="{{ color: class-red | class-blue }}">\` and MetaComponent will generate React TypeScript to require that variable.
  - You can make enumerations with friendly by adding \`as name\` to each option. Eg  \`{{ variableName: box--color-red as Red | box--color-blue as Blue }}\`

- elements
  - Use \`<mt-variable key="variableName">\` to insert a variable such as \`children\` eg \`<div><mt-variable key="children"></div>\`
  - if you want conditional logic there is \`<mt-if test="isShown">thing to show</mt-if>\`. JavaScript expressions are supported and normalized. It would be possible to convert basic JavaScript expressions into equivalents in other template languages.

`);

const whyIsMetaComponent = marked(`
## Why MetaComponent?

It's often the case that large organisations and governments, for a variety of reasons, have a large variety of frontend technology.

They use React, Angular, Vue, Handlebars, Jinja2, Twig, and more.

As a result, their organisation's websites behave and look different.

If your organisation wanted to unify that behaviour and appearance (HTML and CSS) of parts of their web platforms they might look to Design Systems (Pattern Libraries) and make a Design System website with components.

It would be a lot of manual work to support all those web frameworks, so typically Design Systems choose HTML/CSS and only one additional format that they write manually, by hand. Essentially they declare one format the winner: Angular, React, Vue, Handlebars, or Nunjucks., and stacks that don't support that format are left to implement the HTML/CSS manually.

This approach solves one problem but it also creates a technical barrier that may hinder adoption of their Design System*.

MetaComponent tries to complement Design Systems by generating components for each framework to make it easiser to adopt.
`);
