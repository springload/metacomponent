import { useState, useRef } from "react";
import { localStorageWrapper } from "./storage";
import { oneFrameMs } from "./Utils";

import { MetaComponents } from "../lib";

const STORAGE_RESULT_INDEX = "STORAGE_RESULT_INDEX2";

const showEverything = window.document.location?.search.includes("?everything");

let hashState: any = window.location.hash
  ? parseInt(window.location.hash.replace(/#/, ""), 10)
  : undefined;

if (Number.isNaN(hashState)) {
  hashState = undefined;
}

const resultIndexString = localStorageWrapper.getItem(STORAGE_RESULT_INDEX);

const resultIndexNumber = resultIndexString
  ? parseInt(resultIndexString, 10)
  : NaN;

const defaultResultIndex =
  hashState !== undefined
    ? hashState
    : !Number.isNaN(resultIndexNumber)
    ? resultIndexNumber
    : showEverything
    ? 0
    : 5;

export function useComponentModeState(
  metaComponents: MetaComponents | undefined
) {
  const [resultIndex, setResultIndex] = useState<number>(defaultResultIndex);

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

  const resultIndexTimer = useRef<NodeJS.Timeout | undefined>(undefined);

  const publicSetResultIndex = (index: number) => {
    setResultIndex(index);

    window.location.hash = index.toString();
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
        const lowestIndex = showEverything ? 0 : 1;
        if (resultIndex > lowestIndex) {
          publicSetResultIndex(resultIndex - 1);
        }
        break;
      case 39: // right
      case 40: // down
        const numberOfResults =
          (metaComponents && metaComponents.files
            ? Object.keys(metaComponents.files).length
            : 0) + 1;
        if (resultIndex < numberOfResults - 1) {
          publicSetResultIndex(resultIndex + 1);
        }
        break;
    }
  };

  return {
    resultIndex,
    setResultIndex: publicSetResultIndex,
    metaComponents,
    outputValue,
    outputMode,
    showEverything,
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
