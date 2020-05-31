import { parseHTMLWithoutInsertionMode } from "./parseMetaHTML";
import {
  parseAttributeValue,
  MetaAttributeValue,
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

type ParseMetaTemplateStringProps = {
  domDocument: Document;
  metaHTMLString: string;
  cssString: string;
  log: Log;
};

export function parseMetaTemplateString({
  domDocument,
  metaHTMLString,
  cssString,
  log,
}: ParseMetaTemplateStringProps): MetaTemplate {
  parseHTMLWithoutInsertionMode({
    domDocument,
    metaHTMLString,
    cssString,
    log,
  });
  // now we have a DOM representing the original MetaHTMLString, so we need to build a MetaHTML
  const bodyNodes = Array.from(domDocument.body.childNodes);
  const nodes = bodyNodes.map((node) => nodeToMetaNode({ node, log }));
  const metaTemplate = {
    cssString: getAllMatchingCSSRulesRecursively(nodes),
    props: getProps(nodes, log),
    nodes: internalToPublic(nodes),
  };
  return metaTemplate;
}

export type MetaTemplate = {
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
  | MetaHTMLVariable
  | MetaHTMLIfInternal;

export type MetaHTMLElement = {
  type: "Element";
  nodeName: string;
  attributes: Record<string, MetaAttributeValue>;
  children: MetaNode[];
  cssProperties: MetaCSSPropertiesNode[];
};

export type MetaHTMLElementInternal = Omit<MetaHTMLElement, "children"> & {
  children: MetaNodeInternal[];
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
  condition: { id: string; equalsString: string };
  cssPropertiesString: string;
};

export type MetaHTMLText = { type: "Text"; value: string };

export type MetaHTMLComment = { type: "Comment"; value: string };

export type MetaHTMLVariable = {
  type: "Variable";
  id: string;
  optional: boolean;
};

type MetaHTMLIfBase = {
  type: "If";
  optional: boolean;
  children: MetaNode[];
};

export type MetaHTMLIfSuccess = MetaHTMLIfBase & {
  parseError: false;
  ids: string[];
  testAsJavaScriptExpression: string; // a string of codegen'd JS that can be used directly.
  // Other languages should be added. PRs welcome.
};

export type MetaHTMLIfFailure = MetaHTMLIfBase & {
  parseError: true;
  error: string;
};

export type MetaHTMLIf = MetaHTMLIfSuccess | MetaHTMLIfFailure;

export type MetaHTMLIfSuccessInternal = Omit<MetaHTMLIfSuccess, "children"> & {
  children: MetaNodeInternal[];
};

export type MetaHTMLIfFailureInternal = Omit<MetaHTMLIfFailure, "children"> & {
  children: MetaNodeInternal[];
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
    return parseMetaVariable({ htmlElement, log });
  } else if (nodeName === "mt-if") {
    return {
      ...parseMetaHTMLIf({ htmlElement, log }),
      children: Array.from(node.childNodes).map((node) =>
        nodeToMetaNode({ node, log })
      ),
    };
  }

  const attributes = names.reduce(
    (attributes: MetaHTMLElement["attributes"], name: string) => {
      const attributeValue = htmlElement.getAttribute(name);
      if (attributeValue === null) throw Error(`Expected attribute value.`);
      attributes[name] = parseAttributeValue(attributeValue);
      return attributes;
    },
    {} as MetaHTMLElement["attributes"]
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

  cssProperties.push({
    type: "MetaCSSPropertiesConstantNode",
    cssPropertiesString: serializeCSSMatchesAsProperties(resetMatchedCSS),
  });

  Object.keys(attributes)
    .filter(attributesThatCanBeSet)
    .forEach((attributeName: string) => {
      const resetValue = element.getAttribute(attributeName);
      const attributeValues = attributes[attributeName];
      attributeValues.forEach((attributeValue) => {
        if (attributeValue.type === "MetaAttributeVariableOptions") {
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
              cssProperties.push({
                type: "MetaCSSPropertiesConditionalNode",
                condition: { id: attributeValue.id, equalsString: optionName },
                cssPropertiesString,
              });
              if (resetValue) {
                element.setAttribute(attributeName, resetValue);
              }
            }
          );
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
            // We can't predict what MetaAttributeVariable would be
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
      case "Variable":
        return node;
      case "If":
      case "Element":
        return {
          ...node,
          children: node.children.map(walk),
        };
      default:
        throw Error(`Unrecognised node ${node}. ${JSON.stringify(node)}`);
    }
  }

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
    // In CSS the :not() could mean that adding other classes invalidates rules but MetaTemplate
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
    if (node.type !== "Element") return;
    getAllMatchingCSSRules(node.node, node.attributes, matchedCSS);
    node.children.forEach(walk);
  }

  nodes.forEach(walk);

  return serializeCSSMatches(matchedCSS);
}

function attributesThatCanBeSet(attr: string): boolean {
  // used to filter setting attributes on the real DOM
  // we don't really care about any other attributes
  return ["class"].includes(attr);
}
