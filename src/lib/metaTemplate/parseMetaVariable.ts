import { MetaHTMLVariable } from "./metaTemplate";

export const parseMetaVariable = (
  htmlElement: HTMLElement
): MetaHTMLVariable => {
  const id = htmlElement.getAttribute("id") || htmlElement.getAttribute("key"); // 'key' is legacy from MetaTemplate v1
  if (!id)
    throw Error(
      `Expected to find 'id' (or 'key' for legacy support) attribute on mt-variable`
    );
  return { type: "Variable", id };
};
