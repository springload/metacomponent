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
          <div dangerouslySetInnerHTML={{ __html: content1 }}></div>
          <h3>REPL User Interface</h3>
          <Diagram />
          <div dangerouslySetInnerHTML={{ __html: content2 }}></div>

          <button onClick={closeModal} className="close_button">
            close <span aria-hidden> ✘</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

const content1 = marked(`
## MetaComponent REPL

MetaComponent can generate components in React, Django, Vue, Angular, and more.

Some of its use-cases involve:
* migrating to another components format as a one-off conversion;
* providing components in multiple formats as an ongoing feature of a Design System or Pattern Library.
`);

const content2 = marked(`### Use-case: design systems and pattern libraries

It's often the case that governments and large organisations have websites with accidental and unnecessary difference.

An obvious solution would be to make a Design System or Pattern Library where you'd publish UX advice, and components in order to converge on HTML and CSS.

However one stumbling block is that there's also a divergence in web component technology -- they use React, or Vue, Angular, Handlebars, Jinja2, Twig, and many, many more.

It may not be practical to converge template formats, or there might be good reasons for divergence.

It would be a lot of manual work to support all of those web frameworks, and so Design Systems and Pattern Libraries typically offer HTML/CSS, and maybe one additional format, and all of these are written by hand.

Design Systems often solve one problem (standardising HTML/CSS) while creating new technical barriers that may hinder adoption.

MetaComponent complements Design Systems/Pattern Libraries by generating components for many frameworks to make it easiser to adopt.

`);
