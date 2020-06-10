import { Log } from "../log";
import {
  MetaHTMLIfSuccessInternal,
  MetaHTMLIfFailureInternal,
} from "./metaComponent";
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
    htmlElement.getAttribute("test") || htmlElement.getAttribute("key"); // 'key' is legacy from MetaComponent v1
  if (!test) {
    log(
      `Expected to find 'test' (or 'key' for legacy support) attribute on mt-if`
    );
  }

  try {
    let testAsJavaScriptExpression = "";
    let testAsPythonExpression = "";
    let testAsPHPExpression = "";
    let ids: string[] = [];
    if (test) {
      const AST = parseExpression(test);
      if (!["BinaryExpression", "Identifier"].includes(AST.type)) {
        throw Error(
          `<mt-if test="${test}"> expression must only include JavaScript expressions that are either (1) a variable, or (2) a variable comparison to a string " myVar === 'value' " or " myVar !== 'value' ".`
        );
      }
      ids = findIdentifiers(AST);
      switch (AST.type) {
        case "BinaryExpression": {
          testAsJavaScriptExpression = generate(AST).code;
          testAsPythonExpression = `${toPython(AST.left)} ${to2CharOperator(
            AST.operator
          )} ${toPython(AST.right)}`;
          testAsPHPExpression = `${toPHP(AST.left)} ${to2CharOperator(
            AST.operator
          )} ${toPHP(AST.right)}`;
          break;
        }
        case "Identifier": {
          testAsJavaScriptExpression = generate(AST).code;
          testAsPythonExpression = AST.name;
          testAsPHPExpression = `$${AST.name}`;
          break;
        }
      }
    }

    return {
      type: "If",
      ids,
      testAsJavaScriptExpression,
      testAsPythonExpression,
      testAsPHPExpression,
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

function toPHP(astNode: ReturnType<typeof parseExpression>): string {
  switch (astNode.type) {
    case "Identifier":
      return `$${astNode.name.toString()}`;
    case "StringLiteral": {
      return JSON.stringify(astNode.value.toString()); // handles escaping similarly to PHP
    }
  }
  throw Error(`Unsupported AST type "${astNode.type}"`);
}

function toPython(astNode: ReturnType<typeof parseExpression>): string {
  switch (astNode.type) {
    case "Identifier":
      return stringToDjangoVar(astNode.name.toString());
    case "StringLiteral": {
      return JSON.stringify(astNode.value.toString()); // handles escaping similarly to PHP
    }
  }
  throw Error(`Unsupported AST type "${astNode.type}"`);
}

function to2CharOperator(operator: string): string {
  return operator.replace(/===/gi, "==").replace(/!==/gi, "!=");
}

export function stringToDjangoVar(str: string): string {
  return str.replace(/[^a-zA-Z_0-9]/g, "_");
}
