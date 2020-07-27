import React, { Fragment } from "react";
import { Mode } from "./useReplState";
import peacock from "./peacock.png";

type Props = {
  openWhyModal: () => void;
  isWhyOpen: boolean;
  mode: Mode;
  setMode: React.Dispatch<React.SetStateAction<Mode>>;
};

export function Header({ isWhyOpen, openWhyModal, mode, setMode }: Props) {
  return (
    <Fragment>
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
          href="https://twitter.com/hollowaynz"
          target="_blank"
          rel="noreferrer noopener"
          className="button-tray__link"
          aria-label="Twitter @hollowaynz"
        >
          Twitter
        </a>
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
        MetaComponent <abbr title="Read-eval-print loop">REPL</abbr>
        <img
          src={peacock}
          alt="(Peacock Logo)"
          title="Peacock"
          className="title_container__peacock"
        />
      </h1>
      <fieldset className="app_modes">
        <legend>
          <button
            className={`tab2 ${mode === "Component" ? " tab2--selected" : ""}`}
            aria-current={mode === "Component" && "page"}
            aria-label="Switch to Component mode"
            onClick={() => setMode("Component")}
          >
            Component
          </button>
          <button
            className={`tab2 ${mode === "Usage" ? " tab2--selected" : ""}`}
            aria-current={mode === "Usage" && "page"}
            aria-label="Switch to Usage mode"
            onClick={() => setMode("Usage")}
          >
            Usage
          </button>
        </legend>
      </fieldset>
    </Fragment>
  );
}
