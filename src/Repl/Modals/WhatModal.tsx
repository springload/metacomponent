import React from "react";
import Modal from "react-modal";
import marked from "marked";
import { modalStyles } from "./Modal.Util";

type Props = {
  isOpen: boolean;
  closeModal: () => void;
  openWhyModal: () => void;
};

export function WhatModal({ isOpen, closeModal, openWhyModal }: Props) {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={closeModal}
      style={modalStyles}
      contentLabel="What is MetaHTML?"
      shouldCloseOnOverlayClick={true}
    >
      <div className="modal-content" onClick={closeModal} id="what-modal">
        <div
          className="modal-content__body"
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={closeModal} className="close_button">
            close <span aria-hidden> ✘</span>
          </button>
          <div>
            <h2>MetaHTML?</h2>

            <button
              onClick={openWhyModal}
              className="modal__link"
              aria-label="Open modal explaining MetaComponent"
              aria-expanded={false}
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
            aria-expanded={false}
            aria-controls="why-modal"
          >
            <span className="modal__link--peripheral">(see also:</span> Why
            MetaComponent?<span className="modal__link--peripheral">)</span>
          </button>

          <button onClick={closeModal} className="close_button">
            close <span aria-hidden> ✘</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

const whatIsMetaHTML = marked(`

MetaComponent uses **MetaHTML** and **standard CSS** as inputs to generate components in a variety of formats.

MetaHTML is HTML with markers for the parts that should be configurable, as variables.

There are two types of variables, for attributes and elements:

### Attributes
- \`<span class="{{ someVariable }}">\`
  - \`?\` makes it optional \`{{ someVariable? }}\`.
  - multiple variables \`<span class="{{ class }}{{ otherClass }}">\`
- enumerations like \`{{ variableName: option1 | option2 }}\` eg \`<span class="{{ color: class-red | class-blue }}">\` and MetaComponent will generate typings to those valid choices. Enumerations may only be strings.
- label enumerations with friendly names with \`as FriendlyName\` eg  \`class="{{ variableName: box--color-red as Red | box--color-blue as Blue }}"\`.

### Elements
- \`<m-variable id="variableName"></m-variable>\`
  - The attribute \`optional\` makes it optional eg \`<m-variable id="variableName" optional></m-variable>\`
  - provide a default value with child nodes eg \`<m-variable id="variableName">default value</m-variable>\`
- Conditional logic \`<m-if test="isShown">shown if true</m-if>\`, or \`<m-if test="someVariable === 'frogs' ">shown if true</m-if>\`.

MetaHTML is for generating stateless components. Logic should be in a higher-order components (HOC).

There is no support for loops. Use composition instead.


`);
