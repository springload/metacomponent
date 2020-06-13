import React, {
  Fragment,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import marked from "marked";
import Modal from "react-modal";
import { generateTemplates, MetaComponents } from "./lib";
import { localStorageWrapper } from "./storage";
import peacock from "./peacock.png";
import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/mode-html";
import "ace-builds/src-noconflict/mode-css";
import "ace-builds/src-noconflict/theme-monokai";
import "./App.css";
import startCase from "lodash/startCase";

const STORAGE_METAHTML = "STORAGE_METAHTML";
const STORAGE_CSS = "STORAGE_CSS";
const STORAGE_RESULT_INDEX = "STORAGE_RESULT_INDEX";

const oneFrameMs = 15;

const theme = "monokai";

const showEverything = window.document.location?.search.includes("?everything");

let hashState: any = window.location.hash
  ? parseInt(window.location.hash, 10)
  : undefined;
if (Number.isNaN(hashState)) {
  hashState = undefined;
}

const resultIndexString = localStorageWrapper.getItem(STORAGE_RESULT_INDEX);
const resultIndex = resultIndexString
  ? parseInt(resultIndexString, 10)
  : showEverything
  ? 0
  : hashState
  ? hashState
  : 5;

const defaultValues = {
  metaHTML:
    localStorageWrapper.getItem(STORAGE_METAHTML) ||
    `<h1\n  class="my-style {{ colour: my-style--blue as blue | my-style--red as red }}"\n>\n  <m-variable id="children"></m-variable>\n</h1>`,
  css:
    localStorageWrapper.getItem(STORAGE_CSS) ||
    `.my-style { padding: 5px }\n.my-style--blue{ color: blue }\n.my-style--red{ color: red }\n/* this CSS isn't used and will be tree shaken */\n.treeShake { color: green; }`,
  resultIndex: resultIndex,
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
    top: "0px",
    bottom: "0px",
    right: "0px",
    left: "0px",
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
  const [isWhyOpen, setIsWhyOpen] = useState<boolean>(
    window.location.hash.includes("why")
  );
  const debounceTime = useRef<number>(100);
  const iframeRef = useRef(null);

  const openWhatModal = () => {
    setIsWhyOpen(false);
    setIsWhatOpen(true);
  };
  const closeWhatModal = () => setIsWhatOpen(false);

  const openWhyModal = () => {
    setIsWhatOpen(false);
    setIsWhyOpen(true);
  };
  const closeWhyModal = () => setIsWhyOpen(false);

  useEffect(() => {
    const root: HTMLElement | null = document.querySelector("#root");
    if (!root) return;
    if (isWhatOpen || isWhyOpen) {
      root.classList.add("blur");
    } else {
      root.classList.remove("blur");
    }
  }, [isWhatOpen, isWhyOpen]);

  const iframeRefCallback = useCallback((node) => {
    console.log("Setting iframe ", node);
    iframeRef.current = node; // for some reason setting ref={iframeRef} wasn't working in Chrome
  }, []);

  useEffect(() => {
    const fn = () => {
      const iframeEl: HTMLIFrameElement | null = iframeRef.current;
      if (!iframeEl) {
        console.log("No iframe ref available.", iframeEl);
        return;
      }
      // @ts-ignore
      const domDocument = iframeEl.contentWindow?.document;
      if (!domDocument) {
        console.log("No iframe contentWindow document available.", domDocument);
        return;
      }
      const documentElement = domDocument.documentElement;
      if (!documentElement) {
        console.log("No iframe documentElement available.", documentElement);
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
      console.info(`Debouncing calling MetaComponent at ${newDebounceTime}ms`);
      debounceTime.current = newDebounceTime;
      setMetaComponents(result);
    };
    const handler = setTimeout(fn, debounceTime.current);
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
            <div>
              <h2>MetaHTML?</h2>

              <button
                onClick={openWhyModal}
                className="modal__link"
                aria-label="Open modal explaining MetaComponent"
                aria-expanded={isWhyOpen}
                aria-controls="why-modal"
              >
                <span className="modal__link--peripheral">(see also:</span> Why
                MetaComponent?<span className="modal__link--peripheral">)</span>
              </button>
              <div dangerouslySetInnerHTML={{ __html: whatIsMetaHTML }}></div>
            </div>

            <button
              onClick={openWhyModal}
              className="modal__link"
              aria-label="Open modal explaining MetaComponent"
              aria-expanded={isWhyOpen}
              aria-controls="why-modal"
            >
              <span className="modal__link--peripheral">(see also:</span> Why
              MetaComponent?<span className="modal__link--peripheral">)</span>
            </button>

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
            aria-label="Open modal explaining MetaComponent"
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
            aria-label="GitHub Repo"
          >
            Repo
          </a>
        </div>
        <h1 className="title_container">
          MetaComponent REPL{" "}
          <img src={peacock} alt="" className="title_container__peacock" />
        </h1>

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
          ref={iframeRefCallback}
        ></iframe>

        <fieldset className="output_container">
          <legend>
            <span className="output_container--label">Outputs:</span>
            {showEverything && (
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
            )}
            {metaComponents
              ? Object.keys(metaComponents.files).map((file, fileIndex) => (
                  <button
                    key={file}
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
                      window.location.hash = resultIndex.toString();
                    }}
                    title={formatName(file)}
                  >
                    {formatBriefName(file)}
                  </button>
                ))
              : null}
          </legend>
          <Flash
            text={
              <>
                this is uneditable. <br />
                it's the output from MetaComponent <br />
                click tabs above to see formats
              </>
            }
          >
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
          </Flash>
        </fieldset>
      </div>
    </Fragment>
  );
}

type FlashProps = {
  text: React.ReactNode;
  children: React.ReactNode;
};

function Flash({ text, children }: FlashProps) {
  const timer = useRef<NodeJS.Timeout>();
  const [animate, setAnimate] = useState("off");
  const handleKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key.trim() === "") return;
    setAnimate("on");
    timer.current = setTimeout(() => {
      if (timer.current) clearTimeout(timer.current);
      setAnimate("off");
    }, 1000);
  };

  return (
    <div onKeyPress={handleKey} className="flash-container">
      <div className={`flash flash--${animate}`}>
        <span className="flash__text">{text}</span>
      </div>
      {children}
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

function formatName(file: string): string | undefined {
  const dirname = pathType(file);
  if (dirname === "react-styled-components") {
    return "React with Styled Components 💅";
  }
  return undefined;
}

function formatBriefName(file: string): string {
  const dirname = pathType(file);

  switch (dirname) {
    case "html":
      return "HTML";
    case "css":
      return "CSS";
    case "react-styled-components":
      return "React 💅";
    case "vue-jsx":
      return "Vue JSX";
    default:
      return startCase(dirname).replace(/-/g, " ");
  }
}

export default App;

const whatIsMetaHTML = marked(`

MetaComponent uses **MetaHTML** and **standard CSS** as inputs to generate components in a variety of formats.

MetaHTML is HTML with markers for the parts that should be configurable, as variables.

There are two types of variables, for attributes and elements:

- attributes:
  - \`<span class="{{ someVariable }}">\`
    - \`?\` makes it optional \`{{ someVariable? }}\`.
    - multiple variables \`<span class="{{ class }}{{ otherClass }}">\`
  - enumerations like \`{{ variableName: option1 | option2 }}\` eg \`<span class="{{ color: class-red | class-blue }}">\` and MetaComponent will generate typings to those valid choices. Enumerations may only be strings.
  - label enumerations with friendly names with \`as FriendlyName\` eg  \`class="{{ variableName: box--color-red as Red | box--color-blue as Blue }}"\`.
- elements:
  - \`<m-variable id="variableName"></m-variable>\`
    - The attribute \`optional\` makes it optional eg \`<m-variable id="variableName" optional></m-variable>\`
    - provide a default value with child nodes eg \`<m-variable id="variableName">default value</m-variable>\`
  - Conditional logic \`<m-if test="isShown">thing to show if true</m-if>\`, or \`test="someVariable === 'frogs' "\`, using JavaScript expressions. In the future these expressions will be converted to other languages, so please limit to single variable string comparisons for the greatest range of options.

MetaHTML is for generating stateless components. Logic should be in a higher-order components (HOC).

There is no support for loops. Use composition instead.


`);

const whyIsMetaComponent = marked(`
## Why MetaComponent?

MetaComponent can generate stateless components in a variety of languages.

Some of its use-cases involve:
* migrating to another template format as a one-off conversion;
* providing templates in multiple formats as an ongoing feature of a Design System or Pattern Library.

### Design Systems / Pattern Libraries

It's often the case that governments and large organisations have websites with a divergent behaviours and appearances (HTML and CSS) and so an obvious solution is Design Systems and Pattern Libraries where you'd publish UX advice, and components for people to use in order to adhere to the look of your organisation.

There may also be divergence in web component technology -- they use React, Vue, Angular, Handlebars, Jinja2, Twig, and many, many more.

It may not be practical to converge template formats, or there might be good reasons for divergence.

It would be a lot of manual work to support all of those web frameworks, and so Design Systems and Pattern Libraries typically offer HTML/CSS, maybe one additional format, and all of these are written by hand.

Design Systems often solve one problem (standardising HTML/CSS) while creating new technical barriers that may hinder adoption.

**MetaComponent complements Design Systems/Pattern Libraries by generating components for many frameworks to make it easiser to adopt.**

`);

/*
  <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="-3 0 97 100"
              preserveAspectRatio="xMidYMid"
              className="modal-content__diagram"
            >
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="5"
                  markerHeight="3"
                  refX="0"
                  refY="1.5"
                  orient="auto"
                >
                  <polygon points="0 0, 5 1.5, 0 3" />
                </marker>
              </defs>
              <rect
                x="0"
                y="10"
                width="35"
                height="9"
                stroke="#ccc"
                strokeWidth="0.4"
                strokeDasharray="1 1"
              ></rect>
              <text x="5" y="16" fontSize="5" fill="white">
                MetaHTML
              </text>
              <text x="17" y="23" fontSize="5" fill="white">
                +
              </text>
              <rect
                x="0"
                y="24"
                width="35"
                height="9"
                fill="transparent"
                strokeWidth="0.4"
                strokeDasharray="1 1"
              ></rect>
              <text x="5" y="30.5" fontSize="5">
                CSS
              </text>

              <line
                x1="38"
                y1="21.5"
                x2="42"
                y2="21.5"
                strokeWidth="1"
                markerEnd="url(#arrowhead)"
              />

              <rect
                x="50"
                y="10"
                width="35"
                height="23"
                fill="transparent"
                strokeWidth="0.4"
                strokeDasharray="1 1"
              ></rect>
              <text x="53" y="23" fontSize="5" fill="white">
                Components
              </text>
            </svg>
*/
