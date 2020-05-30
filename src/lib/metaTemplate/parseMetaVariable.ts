import { MetaHTMLVariable } from "./metaTemplate";
import { Log } from "../log";

type Props = {
  htmlElement: HTMLElement;
  log: Log;
};

export const parseMetaVariable = ({
  htmlElement,
  log,
}: Props): MetaHTMLVariable => {
  let id = htmlElement.getAttribute("id") || htmlElement.getAttribute("key"); // 'key' is legacy from MetaTemplate v1
  if (!id) {
    log(
      `Expected to find 'id' (or 'key' for legacy support) attribute on mt-variable`
    );
    return { type: "Variable", id: "", optional: false };
  }
  const optional = htmlElement.hasAttribute("optional") || id.includes("?"); // inline '?' is legacy from MetaTemplate v1;
  id = id.replace(/\?/, "");
  return { type: "Variable", id, optional };
};
