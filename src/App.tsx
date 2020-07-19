import React, { Fragment } from "react";
import { ComponentMode } from "./Repl/ComponentMode";

import { WhyModal } from "./Repl/Modals/WhyModal";
import { WhatModal } from "./Repl/Modals/WhatModal";
import { Header } from "./Repl/Header";

import { useReplState } from "./Repl/useReplState";
import { useModalState } from "./Repl/Modals/useModalState";

import "./App.css";

const theme = "monokai";

function App() {
  const {
    mode,
    setMode,
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

  return (
    <Fragment>
      <WhyModal isOpen={isWhyOpen} closeModal={closeWhyModal} />
      <WhatModal
        isOpen={isWhatOpen}
        closeModal={closeWhatModal}
        openWhyModal={openWhyModal}
      />
      <div className={`MetaComponentDemo MetaComponentDemo--mode-${mode}`}>
        <Header
          isWhyOpen={isWhyOpen}
          openWhyModal={openWhyModal}
          mode={mode}
          setMode={setMode}
        />

        <iframe
          id="iframe"
          src="./iframe.html"
          className="iframe_container"
          title="MetaComponent iframe"
          ref={iframeRefCallback}
        ></iframe>

        {mode === "Component" && (
          <ComponentMode
            {...{
              metaComponents,
              resultIndex,
              outputValue,
              outputMode,
              setResultIndex,
              moveResultIndex,
              metaHTML,
              setMetaHTML,
              css,
              setCSS,
              showEverything,
              isWhatOpen,
              isWhyOpen,
              openWhyModal,
              openWhatModal,
              closeWhyModal,
              closeWhatModal,
              theme,
            }}
          />
        )}
      </div>
    </Fragment>
  );
}

export default App;
