import React, { Fragment } from "react";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/mode-html";
import "ace-builds/src-noconflict/mode-css";
import "ace-builds/src-noconflict/theme-monokai";

import { WhyModal } from "./Repl/Modals/WhyModal";
import { WhatModal } from "./Repl/Modals/WhatModal";
import { Header } from "./Repl/Header";
import { Flash } from "./Repl/Flash";
import startCase from "lodash/startCase";
import { useReplState } from "./Repl/useReplState";
import { useModalState } from "./Repl/Modals/useModalState";

import "./App.css";

const theme = "monokai";

function App() {
  const {
    metaHTML,
    setMetaHTML,
    css,
    setCSS,
    showEverything,
    iframeRefCallback,
    metaComponents,
    resultIndex,
    outputValue,
    outputMode,
    setResultIndex,
    moveResultIndex,
  } = useReplState();
  const {
    isWhatOpen,
    isWhyOpen,
    openWhyModal,
    openWhatModal,
    closeWhyModal,
    closeWhatModal,
  } = useModalState();

  // const markers = [];
  // if (
  //   resultIndex > 0 &&
  //   filePaths[resultIndex - 1] &&
  //   pathType(filePaths[resultIndex - 1]).includes("react")
  // ) {
  //   const templateIdIndex = outputValue.indexOf(templateId);
  //   const outputValueBefore = outputValue.substring(0, templateIdIndex);
  //   const rowIndex =
  //     outputValueBefore.length - outputValueBefore.replace(/\n/g, "").length;

  //   const startCol = outputValue.split("\n")[rowIndex].indexOf(templateId);

  //   markers.push({
  //     startRow: rowIndex,
  //     startCol,
  //     endRow: rowIndex,
  //     endCol: startCol + templateId.length - 1,
  //     className: "mt-tooltip",
  //     type: "text" as const,
  //     inFront: true,
  //   });
  // }

  return (
    <Fragment>
      <WhyModal isOpen={isWhyOpen} closeModal={closeWhyModal} />
      <WhatModal
        isOpen={isWhatOpen}
        closeModal={closeWhatModal}
        openWhyModal={openWhyModal}
      />
      <div className="MetaComponentDemo">
        <Header isWhyOpen={isWhyOpen} openWhyModal={openWhyModal} />

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
            onChange={setMetaHTML}
            name="html"
            value={metaHTML}
            width="100%"
            height="100%"
            showGutter={true}
            showPrintMargin={false}
          />
        </fieldset>

        <fieldset className="css_container">
          <legend>Standard CSS</legend>
          <AceEditor
            mode="css"
            theme={theme}
            onChange={setCSS}
            name="css"
            value={css}
            width="100%"
            height="100%"
            showGutter={true}
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
                tabIndex={resultIndex === 0 ? 0 : -1}
                onClick={() => setResultIndex(0)}
                onKeyUp={(e) => moveResultIndex(e, 0)}
              >
                Everything
              </button>
            )}
            {metaComponents
              ? Object.keys(metaComponents.files).map((file, fileIndex) => {
                  const isSelected = resultIndex === fileIndex + 1;
                  const tabIndex = fileIndex + 1;
                  return (
                    <button
                      key={file}
                      role="tab"
                      aria-selected={isSelected}
                      className={`tab ${
                        isSelected ? "tab--selected" : undefined
                      }`}
                      aria-controls="output"
                      id={`tab-${tabIndex}`}
                      onClick={() => setResultIndex(tabIndex)}
                      title={formatName(file)}
                      tabIndex={isSelected ? 0 : -1}
                      onKeyUp={(e) => moveResultIndex(e, tabIndex)}
                    >
                      {formatBriefName(file)}
                    </button>
                  );
                })
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
              // markers={markers}
            />
          </Flash>
        </fieldset>
      </div>
    </Fragment>
  );
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
