import { Log } from "../log";
import {
  MetaHTMLIfSuccessInternal,
  MetaHTMLIfFailureInternal,
} from "./metaTemplate";
import { parseExpression } from "@babel/parser";
import generate from "@babel/generator";

type Props = {
  htmlElement: HTMLElement;
  log: Log;
};

export const parseMetaHTMLIf = ({
  htmlElement,
  log,
}: Props):
  | Omit<MetaHTMLIfSuccessInternal, "children">
  | Omit<MetaHTMLIfFailureInternal, "children"> => {
  const optional = !!htmlElement.hasAttribute("optional");
  const test =
    htmlElement.getAttribute("test") || htmlElement.getAttribute("key"); // 'key' is legacy from MetaTemplate v1
  if (!test) {
    log(
      `Expected to find 'test' (or 'key' for legacy support) attribute on mt-if`
    );
  }

  try {
    let normalizedCode = "";
    if (test) {
      const AST = parseExpression(test);
      normalizedCode = generate(AST).code;
    }
    return {
      type: "If",
      optional,
      parseError: false,
      testAsJavaScriptExpression: normalizedCode,
    };
  } catch (e) {
    log(`JS Expression:\n\t${test}\n`, e);
    return { type: "If", optional, parseError: true, error: e.toString() };
  }
};
