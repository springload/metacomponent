import React, { Fragment } from "react";
import { Flash } from "./Flash";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/mode-html";
import "ace-builds/src-noconflict/mode-css";
import "ace-builds/src-noconflict/theme-monokai";
import { MetaComponents } from "../lib";
import { formatName, formatBriefName } from "./Utils";

type Props = {
  isWhatOpen: boolean;
  theme: string;
  metaHTML: string;
  setMetaHTML: (metaHTML: string) => void;
  css: string;
  setCSS: (css: string) => void;
  showEverything: boolean;
  resultIndex: number;
  setResultIndex: (resultIndex: number) => void;
  outputValue: string;
  outputMode: string;
  moveResultIndex: (
    e: React.KeyboardEvent<HTMLButtonElement>,
    resultIndex: number
  ) => void;
  metaComponents: MetaComponents | undefined;
  openWhatModal: () => void;
};

export function ComponentMode({
  isWhatOpen,
  theme,
  setMetaHTML,
  metaHTML,
  css,
  setCSS,
  showEverything,
  resultIndex,
  outputValue,
  outputMode,
  setResultIndex,
  moveResultIndex,
  metaComponents,

  openWhatModal,
}: Props) {
  return (
    <Fragment>
      <fieldset className="html_container field_textarea">
        <legend>
          Input: MetaHTML
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

      <fieldset className="css_container field_textarea">
        <legend>Input: Standard CSS</legend>
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

      <fieldset className="output_container field_textarea">
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
                    className={`tab ${isSelected ? "tab--selected" : ""}`}
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
            showGutter={true}
            // markers={markers}
          />
        </Flash>
      </fieldset>
    </Fragment>
  );
}
