import { parseHTMLWithoutInsertionMode } from "./parseMetaHTML";
import {
  parseAttributeValue,
  MetaAttributeValue,
  MetaAttributeValues,
  MetaAttributeValuesInternal,
} from "./parseMetaHTMLAttribute";
import { parseMetaVariable } from "./parseMetaVariable";
import {
  cssSniff,
  serializeCSSMatches,
  serializeCSSMatchesAsProperties,
  cssRootDiff,
  CSSSniffRoot,
} from "../cssSniff/cssSniff";
import { parseMetaHTMLIf } from "./parseMetaHTMLIf";
import { getProps, Props } from "./getProps";
import { Log } from "../log";
import { assertUnreachable } from "../makeTemplates/utils";

type ParseMetaComponentStringProps = {
  domDocument: Document;
  metaHTMLString: string;
  cssString: string;
  log: Log;
};

export function parseMetaComponentString({
  domDocument,
  metaHTMLString,
  cssString,
  log,
}: ParseMetaComponentStringProps): MetaComponent {
  parseHTMLWithoutInsertionMode({
    domDocument,
    metaHTMLString,
    cssString,
    log,
  });
  // now we have a DOM representing the original MetaHTMLString, so we need to build a MetaHTML
  const bodyNodes = Array.from(domDocument.body.childNodes);
  const nodes = bodyNodes.map((node) => nodeToMetaNode({ node, log }));
  const metaComponent = {
    cssString: getAllMatchingCSSRulesRecursively(nodes),
    props: getProps(nodes, log),
    nodes: internalToPublic(nodes),
  };
  return metaComponent;
}

export type MetaComponent = {
  cssString: string;
  nodes: MetaNode[];
  props: Props;
};

export type MetaNode =
  | MetaHTMLElement
  | MetaHTMLText
  | MetaHTMLComment
  | MetaHTMLVariable
  | MetaHTMLIf;

export type MetaNodeInternal =
  | MetaHTMLElementInternal
  | MetaHTMLText
  | MetaHTMLComment
  | MetaHTMLVariableInternal
  | MetaHTMLIfInternal;

export type MetaHTMLElement = {
  type: "Element";
  nodeName: string;
  attributes: Record<string, MetaAttributeValues>;
  children: MetaNode[];
  cssProperties: MetaCSSPropertiesNode[];
};

export type MetaHTMLElementInternal = Omit<
  MetaHTMLElement,
  "children" | "attributes"
> & {
  children: MetaNodeInternal[];
  attributes: Record<string, MetaAttributeValuesInternal>;
  node: HTMLElement;
};

export type MetaCSSPropertiesNode =
  | MetaCSSPropertiesConditionalNode
  | MetaCSSPropertiesConstantNode;

export type MetaCSSPropertiesConstantNode = {
  type: "MetaCSSPropertiesConstantNode";
  cssPropertiesString: string;
};

export type MetaCSSPropertiesConditionalNode = {
  type: "MetaCSSPropertiesConditionalNode";
  id: string;
  condition: {
    [equalsString: string]: string; // cssProperties as string
  };
};

export type MetaHTMLText = { type: "Text"; value: string };

export type MetaHTMLComment = { type: "Comment"; value: string };

export type MetaHTMLVariable = {
  type: "Variable";
  id: string;
  children: MetaNode[];
};

export type MetaHTMLVariableInternal = {
  type: "Variable";
  id: string;
  optional: boolean;
  children: MetaNodeInternal[];
};

type MetaHTMLIfBase = {
  type: "If";
  children: MetaNode[];
};

export type MetaHTMLIfSuccess = MetaHTMLIfBase & {
  parseError: false;
  ids: string[];
  testAsJavaScriptExpression: string; // a string of codegen'd JS that can be used directly.
  testAsPythonExpression: string; // a string of codegen'd JS that can be used directly.
  testAsPHPExpression: string; // a string of codegen'd JS that can be used directly.
  // Other languages should be added. PRs welcome.
};

export type MetaHTMLIfFailure = MetaHTMLIfBase & {
  parseError: true;
  error: string;
};

export type MetaHTMLIf = MetaHTMLIfSuccess | MetaHTMLIfFailure;

export type MetaHTMLIfSuccessInternal = Omit<MetaHTMLIfSuccess, "children"> & {
  children: MetaNodeInternal[];
  optional: boolean;
};

export type MetaHTMLIfFailureInternal = Omit<MetaHTMLIfFailure, "children"> & {
  children: MetaNodeInternal[];
  optional: boolean;
};

export type MetaHTMLIfInternal =
  | MetaHTMLIfSuccessInternal
  | MetaHTMLIfFailureInternal;

type NodeToMetaNodeProps = {
  node: ChildNode;
  log: Log;
};

function nodeToMetaNode({ node, log }: NodeToMetaNodeProps): MetaNodeInternal {
  if (node.nodeType === Node.TEXT_NODE) {
    return { type: "Text", value: node.textContent || "" };
  } else if (node.nodeType === Node.COMMENT_NODE) {
    return { type: "Comment", value: node.textContent || "" };
  } else if (node.nodeType !== Node.ELEMENT_NODE) {
    throw Error(`Unhandled nodeType ${node.nodeType}`);
  }

  // @ts-ignore
  const htmlElement: HTMLElement = node;
  const names = Array.from(htmlElement.getAttributeNames());
  const nodeName = htmlElement.nodeName.toLowerCase();

  if (nodeName === "mt-variable") {
    return {
      ...parseMetaVariable({
        htmlElement,
        log,
      }),
      children: Array.from(node.childNodes).map((childNode) =>
        nodeToMetaNode({ node: childNode, log })
      ),
    };
  } else if (nodeName === "mt-if") {
    return {
      ...parseMetaHTMLIf({ htmlElement, log }),
      children: Array.from(node.childNodes).map((childNode) =>
        nodeToMetaNode({ node: childNode, log })
      ),
    };
  }

  const attributes = names.reduce(
    (attributes: MetaHTMLElementInternal["attributes"], name: string) => {
      const attributeValue = htmlElement.getAttribute(name);
      if (attributeValue === null) throw Error(`Expected attribute value.`);
      attributes[name] = parseAttributeValue(attributeValue, log);
      return attributes;
    },
    {} as MetaHTMLElementInternal["attributes"]
  );

  const cssProperties = getAllMatchingCSSProperties(htmlElement, attributes);

  return {
    type: "Element",
    nodeName,
    attributes: attributes,
    node: htmlElement,
    children: Array.from(node.childNodes).map((node) =>
      nodeToMetaNode({ node, log })
    ),
    cssProperties,
  };
}

function getAllMatchingCSSProperties(
  element: HTMLElement,
  attributes: MetaHTMLElement["attributes"]
): MetaCSSPropertiesNode[] {
  const cssProperties: MetaCSSPropertiesNode[] = [];

  resetElementAttributes(element, attributes);

  const resetMatchedCSS = cssSniff([element], { ignoreChildren: true });

  const cssPropertiesStringConstants = serializeCSSMatchesAsProperties(
    resetMatchedCSS
  );

  if (cssPropertiesStringConstants) {
    cssProperties.push({
      type: "MetaCSSPropertiesConstantNode",
      cssPropertiesString: cssPropertiesStringConstants,
    });
  }

  Object.keys(attributes)
    .filter(attributesThatCanBeSet)
    .forEach((attributeName: string) => {
      const resetValue = element.getAttribute(attributeName);
      const attributeValues = attributes[attributeName];
      attributeValues.forEach((attributeValue) => {
        if (attributeValue.type === "MetaAttributeVariableOptions") {
          const conditionalNode: MetaCSSPropertiesConditionalNode = {
            type: "MetaCSSPropertiesConditionalNode",
            id: attributeValue.id,
            condition: {},
          };
          Object.entries(attributeValue.options).forEach(
            ([optionName, optionValue]) => {
              element.setAttribute(
                attributeName,
                `${resetValue ? `${resetValue} ` : ""}${optionValue}`
              );
              const matchedCSS = cssSniff([element], { ignoreChildren: true });
              const cssRoot = cssRootDiff(resetMatchedCSS, matchedCSS);
              const cssPropertiesString = serializeCSSMatchesAsProperties(
                cssRoot
              );
              if (cssPropertiesString) {
                conditionalNode.condition[optionName] = cssPropertiesString;
              }
              if (resetValue) {
                element.setAttribute(attributeName, resetValue);
              }
            }
          );
          if (Object.keys(conditionalNode.condition).length > 0) {
            cssProperties.push(conditionalNode);
          }
        }
      });
    });

  return cssProperties;
}

function resetElementAttributes(
  element: HTMLElement,
  attributes: MetaHTMLElement["attributes"]
): void {
  Object.keys(attributes)
    .filter(attributesThatCanBeSet)
    .forEach((name: string) => {
      const attribute = attributes[name];
      element.setAttribute(
        name,
        attribute
          .map((metaAttribute) => {
            if (metaAttribute.type === "MetaAttributeConstant") {
              return ` ${metaAttribute.value}`;
            }
            // We can't predict what MetaAttributeVariable might be
            return "";
          })
          .join(" ")
      );
    });
}

function internalToPublic(nodes: MetaNodeInternal[]): MetaNode[] {
  // discards the Node variable which shouldn't be exposed to consumers
  function walk(node: MetaNodeInternal): MetaNode {
    switch (node.type) {
      case "Comment":
      case "Text":
        return node;
      case "Variable":
        return {
          type: node.type,
          id: node.id,
          children: node.children.map(walk),
        };
      case "If":
        if (node.parseError) {
          return {
            type: node.type,
            parseError: node.parseError,
            children: node.children,
            error: node.error,
          };
        } else {
          return {
            type: node.type,
            parseError: node.parseError,
            ids: node.ids,
            children: node.children,
            testAsJavaScriptExpression: node.testAsJavaScriptExpression,
            testAsPythonExpression: node.testAsPythonExpression,
            testAsPHPExpression: node.testAsPHPExpression,
          };
        }
      case "Element":
        return {
          type: node.type,
          nodeName: node.nodeName,
          attributes: walkAttributes(node.attributes),
          cssProperties: node.cssProperties,
          children: node.children.map(walk),
        };
      default:
        throw Error(`Unrecognised node ${node}. ${JSON.stringify(node)}`);
    }
  }

  const walkAttributes = (
    internalAttributes: MetaHTMLElementInternal["attributes"]
  ): MetaHTMLElement["attributes"] => {
    const keys = Object.keys(internalAttributes);
    return keys.reduce(
      (
        attributes: MetaHTMLElement["attributes"],
        key: string
      ): MetaHTMLElement["attributes"] => {
        const values = internalAttributes[key];
        const newAttributeValues = values.map(
          (value): MetaAttributeValue => {
            switch (value.type) {
              case "MetaAttributeConstant": {
                return value;
              }
              case "MetaAttributeVariable": {
                return {
                  type: value.type,
                  id: value.id,
                };
              }
              case "MetaAttributeVariableOptions": {
                return {
                  type: value.type,
                  id: value.id,
                  options: value.options,
                };
              }
            }
            return assertUnreachable(value);
          }
        );
        attributes[key] = newAttributeValues;
        return attributes;
      },
      {} as MetaHTMLElement["attributes"]
    );
  };

  return nodes.map(walk);
}

function getAllMatchingCSSRulesRecursively(nodes: MetaNodeInternal[]): string {
  const matchedCSS: CSSSniffRoot = {};

  function getAllMatchingCSSRules(
    element: HTMLElement,
    attributes: MetaHTMLElement["attributes"],
    matchedCSS: CSSSniffRoot
  ) {
    // Set ALL classes on element so we can find matching CSS rules.
    //
    // The htmlElement.className value looks like a string of,
    //   "thing {{ someId: class1 | class2 }} {{ someId: class3 as name1 | class4 as name2 }} "
    // so we want to turn that into a string of,
    //   "thing class1 class2 class3 class4"
    //
    // In CSS the :not() could mean that adding other classes invalidates rules but MetaComponent
    // doesn't support that.

    Object.keys(attributes)
      .filter(attributesThatCanBeSet)
      .forEach((name: string) => {
        const newValue = attributes[name]
          .map((metaAttribute) => {
            if (metaAttribute.type === "MetaAttributeConstant") {
              return ` ${metaAttribute.value}`;
            } else if (metaAttribute.type === "MetaAttributeVariableOptions") {
              return ` ${Object.values(metaAttribute.options).join(" ")}`;
            }
            // Else, it's a MetaAttributeVariable.
            // We can't predict what value MetaAttributeVariable would have so we can't
            // support detecting CSS based on that
            return "";
          })
          .join(" ");

        element.setAttribute(name, newValue);
      });

    cssSniff([element], { ignoreChildren: true }, matchedCSS);
  }

  function walk(node: MetaNodeInternal): void {
    switch (node.type) {
      case "Element":
        getAllMatchingCSSRules(node.node, node.attributes, matchedCSS);
        node.children.forEach(walk);
        break;
      case "If":
      case "Variable":
        node.children.forEach(walk);
        break;
    }
  }

  nodes.forEach(walk);

  return serializeCSSMatches(matchedCSS);
}

function attributesThatCanBeSet(attr: string): boolean {
  // used to filter setting attributes on the real DOM
  // we don't really care about any other attributes
  return ["class"].includes(attr);
}
