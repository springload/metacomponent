import React, { Fragment } from "react";
import { ComponentMode } from "./Repl/ComponentMode";
import { UsageMode } from "./Repl/UsageMode";

import { WhyModal } from "./Repl/Modals/WhyModal";
import { WhatModal } from "./Repl/Modals/WhatModal";
import { Header } from "./Repl/Header";

import { useComponentModeState } from "./Repl/useComponentModeState";
import { useModalState } from "./Repl/Modals/useModalState";

import "./App.css";
import { useAppState } from "./Repl/useAppState";

const theme = "monokai";

function App() {
  const {
    mode,
    setMode,
    iframeRefCallback,
    metaHTMLs,
    setMetaHTMLs,
    CSSs,
    setCSSs,
    metaComponents,
  } = useAppState();

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
              //resultIndex,
              //  outputValue,
              // outputMode,
              // setResultIndex,
              // moveResultIndex,
              metaHTML: metaHTMLs[0],
              setMetaHTML: (metaHTML: string) => setMetaHTMLs([metaHTML]),
              css: CSSs[0],
              setCSS: (css: string) => setCSSs([css]),
              // showEverything,
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
        {mode === "Usage" && (
          <UsageMode
            {...{
              theme,
              metaHTMLs,
              setMetaHTMLs,
              CSSs,
              setCSSs,
            }}
          />
        )}
      </div>
    </Fragment>
  );
}

export default App;
