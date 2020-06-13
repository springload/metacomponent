import { useState, useRef, useCallback, useEffect } from "react";

import { localStorageWrapper } from "./storage";
import { generateTemplates, MetaComponents } from "../lib";

const STORAGE_RESULT_INDEX = "STORAGE_RESULT_INDEX2";
const STORAGE_METAHTML = "STORAGE_METAHTML2";
const STORAGE_CSS = "STORAGE_CSS2";

const oneFrameMs = 15;

const showEverything = window.document.location?.search.includes("?everything");

let hashState: any = window.location.hash
  ? parseInt(window.location.hash, 10)
  : undefined;
if (Number.isNaN(hashState)) {
  hashState = undefined;
}

const resultIndexString = localStorageWrapper.getItem(STORAGE_RESULT_INDEX);
const resultIndex = resultIndexString
  ? parseInt(resultIndexString, 10)
  : showEverything
  ? 0
  : hashState
  ? hashState
  : 5;

const defaultValues = {
  metaHTML:
    localStorageWrapper.getItem(STORAGE_METAHTML) ||
    `<h1\n  class="my-style {{ colour: my-style--blue as blue | my-style--red as red }}"\n>\n  <m-variable id="children">default content</m-variable>\n</h1>`,
  css:
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
/* the following CSS isn't used and will be tree shaken */
.treeShake {
  color: green;
}`.trim(),
  resultIndex: resultIndex,
};

const templateId = "MyComponent";

export function useReplState() {
  const [metaHTML, setMetaHTML] = useState<string>(defaultValues.metaHTML);
  const [css, setCSS] = useState<string>(defaultValues.css);
  const [resultIndex, setResultIndex] = useState<number>(
    defaultValues.resultIndex
  );
  const [metaComponents, setMetaComponents] = useState<MetaComponents>();
  const iframeRef = useRef(null);
  const debounceTime = useRef<number>(100);

  const iframeRefCallback = useCallback((node) => {
    console.log("Setting iframe ", node);
    iframeRef.current = node; // for some reason setting ref={iframeRef} wasn't working in Chrome
  }, []);

  useEffect(() => {
    const fn = () => {
      const iframeEl: HTMLIFrameElement | null = iframeRef.current;
      if (!iframeEl) {
        console.log("No iframe ref available.", iframeEl);
        return;
      }
      // @ts-ignore
      const domDocument = iframeEl.contentWindow?.document;
      if (!domDocument) {
        console.log("No iframe contentWindow document available.", domDocument);
        return;
      }
      const documentElement = domDocument.documentElement;
      if (!documentElement) {
        console.log("No iframe documentElement available.", documentElement);
        return;
      }
      const startTime = Date.now();
      const result = generateTemplates({
        domDocument,
        templateId,
        metaHTMLString: metaHTML,
        cssString: css,
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
    const handler = setTimeout(fn, debounceTime.current);
    return () => clearTimeout(handler);
  }, [metaHTML, css]);

  const filePaths = metaComponents ? Object.keys(metaComponents.files) : [];

  const outputValue = metaComponents
    ? resultIndex === 0
      ? JSON.stringify(metaComponents, null, 2)
      : filePaths[resultIndex - 1]
      ? metaComponents.files[filePaths[resultIndex - 1]]
      : ""
    : "";

  const outputMode =
    resultIndex === 0
      ? "json"
      : filePaths[resultIndex - 1]
      ? aceMode(filePaths[resultIndex - 1])
      : "json";

  const htmlTimer = useRef<NodeJS.Timeout | undefined>(undefined);

  const publicSetMetaHTML = (val: string) => {
    let html = val;
    // DEVELOPER NOTE
    // This just seems to crash and I don't know why
    //
    // try {
    //   console.log({ html });
    //   html = prettier.format(html, {
    //     parser: "html",
    //     printWidth: 80,
    //     plugins: [parserHTML],
    //   });
    // } catch (e) {
    //   console.error(e);
    // }
    html = html || val;
    setMetaHTML(html);
    if (htmlTimer.current) {
      clearTimeout(htmlTimer.current);
    }
    htmlTimer.current = setTimeout(
      (_) => localStorageWrapper.setItem(STORAGE_METAHTML, html),
      oneFrameMs
    );
  };

  const cssTimer = useRef<NodeJS.Timeout | undefined>(undefined);

  const publicSetCSS = (css: string) => {
    setCSS(css);
    if (cssTimer.current) {
      clearTimeout(cssTimer.current);
    }
    cssTimer.current = setTimeout(
      (_) => localStorageWrapper.setItem(STORAGE_CSS, css),
      oneFrameMs
    );
  };

  const resultIndexTimer = useRef<NodeJS.Timeout | undefined>(undefined);

  const setResultIndexPublic = (index: number) => {
    setResultIndex(index);

    window.location.hash = resultIndex.toString();
    const tabButton = document.getElementById(`tab-${index}`);
    if (tabButton) {
      tabButton.focus();
    }
    if (resultIndexTimer.current) {
      clearTimeout(resultIndexTimer.current);
    }
    resultIndexTimer.current = setTimeout(
      (_) =>
        localStorageWrapper.setItem(STORAGE_RESULT_INDEX, index.toString()),
      oneFrameMs
    );
  };

  const moveResultIndex = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    resultIndex: number
  ) => {
    const keyCode = e.which || e.keyCode;
    switch (keyCode) {
      case 37: // left
      case 38: // up
        if (resultIndex > 0) {
          setResultIndexPublic(resultIndex - 1);
        }
        break;
      case 39: // right
      case 40: // down
        const numberOfResults =
          (metaComponents && metaComponents.files
            ? Object.keys(metaComponents.files).length
            : 0) + 1;
        if (resultIndex < numberOfResults) {
          setResultIndexPublic(resultIndex + 1);
        }
        break;
    }
  };

  return {
    metaHTML,
    setMetaHTML: publicSetMetaHTML,
    css,
    setCSS: publicSetCSS,
    resultIndex,
    setResultIndex,
    templateId,
    iframeRef,
    iframeRefCallback,
    metaComponents,
    outputValue,
    outputMode,
    showEverything,
    setResultIndexPublic,
    moveResultIndex,
  };
}

function aceMode(file: string) {
  const dirname = file.substring(0, file.indexOf("/"));
  if (dirname === "react") {
    return "javascript";
  }
  return dirname;
}
