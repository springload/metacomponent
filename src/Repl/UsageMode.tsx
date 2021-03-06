import React, { Fragment } from "react";
import AceEditor from "react-ace";
import "./UsageMode.css";

type Props = {
  theme: string;
  metaHTMLs: string[];
  setMetaHTMLs: (metaHTMLs: string[]) => void;
  CSSs: string[];
  setCSSs: (CSSs: string[]) => void;
};

export function UsageMode({
  theme,
  setMetaHTMLs,
  metaHTMLs,
  CSSs,
  setCSSs,
}: Props) {
  return (
    <Fragment>
      <div className="html_container">
        {metaHTMLs.map((metaHTML, index) => (
          <Fragment>
            <fieldset className=" field_textarea">
              <legend>Input: MetaHTML</legend>
              <AceEditor
                mode="html"
                theme={theme}
                onChange={(newMetaHTML) => {
                  const newMetaHTMLs = [...metaHTMLs];
                  newMetaHTMLs[index] = newMetaHTML;
                  setMetaHTMLs(newMetaHTMLs);
                }}
                name="html"
                value={metaHTML}
                width="100%"
                height="100%"
                showGutter={true}
                showPrintMargin={false}
              />
            </fieldset>
          </Fragment>
        ))}
      </div>
      <div className="css_container">
        {CSSs.map((css, index) => (
          <Fragment>
            <fieldset className=" field_textarea">
              <legend>Input: Standard CSS</legend>
              <AceEditor
                mode="css"
                theme={theme}
                onChange={(newCSS) => {
                  const newCSSs = [...CSSs];
                  newCSSs[index] = newCSS;
                  setCSSs(newCSSs);
                }}
                name="css"
                value={CSSs[index]}
                width="100%"
                height="100%"
                showGutter={true}
                showPrintMargin={false}
              />
            </fieldset>
          </Fragment>
        ))}
      </div>
      <button
        className="add_container"
        onClick={() => {
          setMetaHTMLs([...metaHTMLs, ""]);
          setCSSs([...CSSs, ""]);
        }}
      >
        +
      </button>
    </Fragment>
  );
}
