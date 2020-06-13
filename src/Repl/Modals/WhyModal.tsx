import React from "react";
import Modal from "react-modal";
import marked from "marked";
import { modalStyles } from "./Modal.Util";

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
          <div dangerouslySetInnerHTML={{ __html: whyIsMetaComponent }}></div>

          <button onClick={closeModal} className="close_button">
            close <span aria-hidden> ✘</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

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
