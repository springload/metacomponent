import { parseHTMLWithoutInsertionMode } from "./parseHTMLWithoutInsertionMode";
import {
  parseAttributeValue,
  MetaAttributeValue,
} from "./parseMetaHTMLAttribute";
import {
  cssSniff,
  serializeCSSMatches,
  CSSSniffRoot,
  serializeCSSMatchesAsProperties,
} from "../cssSniff/cssSniff";

export function parseMetaHTMLString(
  window: Window,
  metaHTMLString: string,
  cssString: string
): MetaHTML {
  console.log("in");
  window = parseHTMLWithoutInsertionMode(window, metaHTMLString, cssString);
  // now we have a DOM representing the original MetaHTMLString, so we need to build a MetaHTML
  const bodyNodes = Array.from(window.document.body.childNodes);
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
  const names = htmlElement.getAttributeNames();
  const attributes = names.reduce(
    (attributes: MetaHTMLElement["attributes"], name: string) => {
      const attributeValue = htmlElement.getAttribute(name);
      if (attributeValue === null) throw Error(`Expected attribute value.`);
      attributes[name] = parseAttributeValue(attributeValue);
      return attributes;
    },
    {}
  );

  return {
    type: "Element",
    nodeName: htmlElement.nodeName,
    attributes,
    node: htmlElement,
    children: Array.from(node.childNodes).map(nodeToMetaHTMLNode),
    cssProperties: getAllMatchingCSSProperties(htmlElement, attributes),
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

  Object.keys(attributes).forEach((attributeName: string) => {
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

            const cssPropertiesString = cssPropertiesDiff(
              resetMatchedCSS,
              matchedCSS
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

function cssPropertiesDiff(a: MatchedCSS, b: MatchedCSS): string {
  let cssPropertiesString: string = "";
  Object.keys(b).forEach((index) => {
    if (a[index]) return;
    if (!b[index].properties) return;
    cssPropertiesString += b[index].properties;
  });
  return cssPropertiesString;
}

function resetElementAttributes(
  element: HTMLElement,
  attributes: MetaHTMLElement["attributes"]
): void {
  Object.keys(attributes).forEach((name: string) => {
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
  function getAllMatchingCSSRules(
    element: HTMLElement,
    attributes: MetaHTMLElement["attributes"],
    matchedCSS: MatchedCSS
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

    if (attributes["class"]) {
      element.className = attributes["class"]
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
    }

    cssSniff([element], { ignoreChildren: true }, matchedCSS);
  }

  const matchedCSS: MatchedCSS = {};

  function walk(node: MetaHTMLNodeInternal): void {
    if (node.type !== "Element") return;
    console.log("Checking CSS for ", node.node.nodeName);
    getAllMatchingCSSRules(node.node, node.attributes, matchedCSS);
    node.children.forEach(walk);
  }

  nodes.forEach(walk);

  console.log({ end: matchedCSS });

  return serializeCSSMatches(matchedCSS);
}
