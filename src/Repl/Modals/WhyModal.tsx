import React from "react";
import Modal from "react-modal";
import marked from "marked";
import { modalStyles } from "./Modal.Util";
import { Diagram } from "../Diagram";

type Props = {
  isOpen: boolean;
  closeModal: () => void;
};

export function WhyModal({ isOpen, closeModal }: Props) {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={closeModal}
      style={modalStyles}
      contentLabel="Why is MetaComponent?"
      shouldCloseOnOverlayClick={true}
    >
      <div className="modal-content" onClick={closeModal} id="why-modal">
        <div
          className="modal-content__body"
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={closeModal} className="close_button">
            close <span aria-hidden> ✘</span>
          </button>
          <h2>
            MetaComponent <abbr title="Read-eval-print loop">REPL</abbr>
          </h2>
          <div dangerouslySetInnerHTML={{ __html: content1 }}></div>
          <h3>
            <abbr title="Read-eval-print loop">REPL</abbr> User Interface
          </h3>
          <Diagram />
          <details>
            <summary>Use-case 1: design systems and pattern libraries</summary>
            <p>
              It's often the case that governments and large organisations have
              websites that have very different websites and components, and
              these differences are often accidental or unnecessary.
            </p>

            <p>
              An obvious solution would be to make a Design System or Pattern
              Library where you'd publish components to unify HTML and CSS.
            </p>

            <p>
              However one stumbling block is when there's also a divergence in
              web component technology -- they use React, or Vue, Angular,
              Handlebars, Jinja2, Twig, and many, many more.
            </p>

            <p>
              It would be a lot of manual work to support all of those comonent
              formats, and so Design Systems and Pattern Libraries typically
              offer HTML/CSS, and maybe one additional format, and all of these
              are written by hand.
            </p>

            <p>
              Design Systems often solve one problem (standardising HTML/CSS)
              while creating new technical barriers that may hinder adoption.
            </p>

            <p>
              MetaComponent complements Design Systems Pattern Libraries by
              generating components for many frameworks to make it easiser to
              adopt.
            </p>
          </details>

          <button onClick={closeModal} className="close_button">
            close <span aria-hidden> ✘</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

const content1 = marked(`
MetaComponent can generate components in React, Django, Vue, Angular, and more.

Some of its use-cases are:
1. providing components in multiple formats as an ongoing feature of a Design System or Pattern Library.
2. learning about similarities and differences in component languages.
`);
