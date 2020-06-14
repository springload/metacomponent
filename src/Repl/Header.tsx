import React, { Fragment } from "react";
import peacock from "./peacock.png";

type Props = {
  openWhyModal: () => void;
  isWhyOpen: boolean;
};

export function Header({ isWhyOpen, openWhyModal }: Props) {
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
    </Fragment>
  );
}
