import { parseHTMLWithoutInsertionMode } from "./parseHTMLWithoutInsertionMode";
import {
  parseAttributeValue,
  MetaAttributeValue,
} from "./parseMetaHTMLAttribute";
import {
  cssSniff,
  serializeCSSMatches,
  serializeCSSMatchesAsProperties,
  cssRootDiff,
  CSSSniffRoot,
} from "../cssSniff/cssSniff";

export function parseMetaHTMLString(
  domDocument: Document,
  metaHTMLString: string,
  cssString: string
): MetaHTML {
  parseHTMLWithoutInsertionMode(domDocument, metaHTMLString, cssString);

  // now we have a DOM representing the original MetaHTMLString, so we need to build a MetaHTML
  const bodyNodes = Array.from(domDocument.body.childNodes);

  const nodes = bodyNodes.map(nodeToMetaHTMLNode);

  const metaHTML = {
    cssString: getAllMatchingCSSRulesRecursively(nodes),
    nodes: internalToPublic(nodes),
  };
  return metaHTML;
}

export type MetaHTML = {
  cssString: string;
  nodes: MetaHTMLNode[];
};

export type MetaHTMLNode = MetaHTMLElement | MetaHTMLText | MetaHTMLComment;

export type MetaHTMLNodeInternal =
  | MetaHTMLElementInternal
  | MetaHTMLText
  | MetaHTMLComment;

export type MetaHTMLElementInternal = {
  type: "Element";
  nodeName: string;
  attributes: Record<string, MetaAttributeValue>;
  children: MetaHTMLNodeInternal[];
  node: HTMLElement;
  cssProperties: MetaCSSPropertiesNode[];
};

export type MetaHTMLElement = {
  type: "Element";
  nodeName: string;
  attributes: Record<string, MetaAttributeValue>;
  children: MetaHTMLNode[];
  cssProperties: MetaCSSPropertiesNode[];
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

function nodeToMetaHTMLNode(node: ChildNode): MetaHTMLNodeInternal {
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
  console.log(names);
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
  console.log("after get all ");

  return {
    type: "Element",
    nodeName: htmlElement.nodeName,
    attributes: attributes,
    node: htmlElement,
    children: Array.from(node.childNodes).map(nodeToMetaHTMLNode),
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

function internalToPublic(nodes: MetaHTMLNodeInternal[]): MetaHTMLNode[] {
  function walk(node: MetaHTMLNodeInternal): MetaHTMLNode {
    if (node.type !== "Element") {
      return node;
    }
    return {
      type: "Element",
      nodeName: node.nodeName.toLowerCase(), // because it will be uppercase and who wants that?
      attributes: node.attributes,
      children: node.children.map(walk),
      cssProperties: node.cssProperties,
    };
  }

  return nodes.map(walk);
}

function getAllMatchingCSSRulesRecursively(
  nodes: MetaHTMLNodeInternal[]
): string {
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

  function walk(node: MetaHTMLNodeInternal): void {
    if (node.type !== "Element") return;
    getAllMatchingCSSRules(node.node, node.attributes, matchedCSS);
    node.children.forEach(walk);
  }

  nodes.forEach(walk);

  return serializeCSSMatches(matchedCSS);
}

function attributesThatCanBeSet(attr: string): boolean {
  // setting any attribute can cause bugs in JSDOM
  return ["class"].includes(attr);
}
