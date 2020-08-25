import { useState, useRef, useEffect, useCallback } from "react";
import { generateTemplates, MetaComponents } from "../lib";
import { oneFrameMs } from "./Utils";
import { localStorageWrapper } from "./storage";

export type Mode = "Component" | "Usage";

export function useAppState() {
  const [mode, setMode] = useState<Mode>("Component");
  const iframeRef = useRef(null);

  const [metaHTMLs, setMetaHTMLs] = useState<string[]>(defaultValues.metaHTML);
  const [CSSs, setCSSs] = useState<string[]>(defaultValues.css);
  const [templateIds, setTemplateIds] = useState<string[]>(
    defaultValues.templateId
  );
  const [metaComponents, setMetaComponents] = useState<MetaComponents>();

  const debounceTime = useRef<number>(250);

  const reprocessTimer = useRef<NodeJS.Timeout | undefined>(undefined);

  const reprocessMetaComponent = () => {
    const iframeEl: HTMLIFrameElement | null = iframeRef.current;
    if (!iframeEl) {
      console.log("No iframe ref available. Retrying soon...", iframeEl);
      reprocessMetaComponentSoon();
      return;
    }
    // @ts-ignore
    const domDocument = iframeEl.contentWindow?.document;
    if (!domDocument) {
      console.log(
        "No iframe contentWindow document available. Retrying soon...",
        domDocument
      );
      reprocessMetaComponentSoon();
      return;
    }
    const documentElement = domDocument.documentElement;
    if (!documentElement) {
      console.log(
        "No iframe documentElement available. Retrying soon...",
        documentElement
      );
      reprocessMetaComponentSoon();
      return;
    }
    const startTime = Date.now();
    const result = generateTemplates({
      domDocument,
      templateId: templateIds[0],
      metaHTMLString: metaHTMLs[0],
      cssString: CSSs[0],
      haltOnErrors: false,
    });
    const endTime = Date.now();
    let newDebounceTime = endTime - startTime;
    newDebounceTime =
      newDebounceTime < oneFrameMs ? oneFrameMs : newDebounceTime;
    console.info(`Debouncing calling MetaComponent at ${newDebounceTime}ms`);
    debounceTime.current = newDebounceTime;
    setMetaComponents(result);
  };

  const reprocessMetaComponentSoon = () => {
    if (reprocessTimer.current) {
      clearTimeout(reprocessTimer.current);
    }
    reprocessTimer.current = setTimeout(
      reprocessMetaComponent,
      debounceTime.current
    );
  };

  const iframeRefCallback = useCallback((node) => {
    /* eslint-disable */
    console.log("Setting iframe ", node);
    iframeRef.current = node; // for some reason setting ref={iframeRef} wasn't working in Chrome
    reprocessMetaComponentSoon();
  }, []); /* eslint-disable */

  useEffect(() => {
    reprocessMetaComponentSoon();
  }, [metaHTMLs, CSSs]);

  return {
    mode,
    setMode,
    iframeRef,
    metaHTMLs,
    setMetaHTMLs,
    CSSs,
    setCSSs,
    iframeRefCallback,
    metaComponents,
    setMetaComponents,
  };
}

const STORAGE_METAHTML = "STORAGE_METAHTML2";
const STORAGE_CSS = "STORAGE_CSS2";

const defaultValues = {
  metaHTML: [
    localStorageWrapper.getItem(STORAGE_METAHTML) ||
      `<h1\n class="my-style {{ colour: my-style--blue as blue | my-style--red as red }}"\n>\n  <m-variable id="children" optional>fallback content...</m-variable>\n</h1>`,
  ],
  css: [
    localStorageWrapper.getItem(STORAGE_CSS) ||
      `
  .my-style {
    padding: 5px;
  }
  .my-style--blue {
    color: blue;
  }
  .my-style--red {
    color: red;
  }
  /* the following CSS isn't used and will be tree shaken! */
  .treeShake {
    color: green;
  }`.trim(),
  ],
  templateId: ["MyComponent"],
};
