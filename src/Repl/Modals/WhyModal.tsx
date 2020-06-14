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
* providing components in multiple formats as an ongoing feature of a Design System or Pattern Library.
* learning about similarities and differences in component languages.
`);
