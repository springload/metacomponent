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
    let testAsJavaScriptExpression = "";
    let ids: string[] = [];
    if (test) {
      const AST = parseExpression(test);
      ids = findIdentifiers(AST);
      testAsJavaScriptExpression = generate(AST).code;
    }
    return {
      type: "If",
      ids,
      testAsJavaScriptExpression,
      optional,
      parseError: false,
    };
  } catch (e) {
    log(`JS Expression:\n\t${test}\n`, e);
    return { type: "If", optional, parseError: true, error: e.toString() };
  }
};

function findIdentifiers(AST: ReturnType<typeof parseExpression>): string[] {
  const ids: string[] = [];

  const walk = (node: any) => {
    if (node.type === "Identifier" && node.name) {
      ids.push(node.name);
    } else if (node.identifierName) {
      ids.push(node.identifierName);
    }
    // Object.keys(node).forEach((name) => walk(node[name]));
  };
  // @ts-ignore
  Object.keys(AST).forEach((name) => walk(AST[name]));

  return ids;
}
