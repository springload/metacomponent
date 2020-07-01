import { MetaHTMLVariableInternal } from "./metaComponent";
import { Log } from "../log";

type Props = {
  htmlElement: HTMLElement;
  log: Log;
};

export const parseMetaVariable = ({
  htmlElement,
  log,
}: Props): MetaHTMLVariableInternal => {
  let id = htmlElement.getAttribute("id") || htmlElement.getAttribute("key"); // 'key' is legacy from MetaComponent v1
  if (!id) {
    log(
      `Expected to find 'id' (or 'key' for legacy support) attribute on m-variable ${htmlElement.outerHTML}`
    );
    return { type: "Variable", id: "", optional: false, children: [] };
  }
  const optional = htmlElement.hasAttribute("optional") || id.includes("?"); // inline '?' is legacy from MetaComponent v1;
  id = id.replace(/\?/, "").trim();
  if (id.length === 0) {
    log(
      `Expected to find id with value on variable but it was an empty string. ${htmlElement.outerHTML}`
    );
  }
  return { type: "Variable", id, optional, children: [] };
};
