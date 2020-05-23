import { parseHTMLWithoutInsertionMode } from "./parseHTMLWithoutInsertionMode";
import {
  parseAttributeValue,
  MetaAttributeValue,
  MetaAttributeVariableOptions,
} from "./parseMetaHTMLAttribute";
import { cssSniff, serializeCSSMatches } from "../cssSniff/cssSniff";

export function parseMetaHTMLString(
  window: Window,
  metaHTMLString: string,
  cssString: string
): MetaHTML {
  window = parseHTMLWithoutInsertionMode(window, metaHTMLString, cssString);
  // now we have a DOM representing the original MetaHTMLString, so we need to build a MetaHTML
  const bodyNodes = Array.from(window.document.body.childNodes);
  return bodyNodes.map(nodeToMetaHTMLNode);
}

type MetaHTML = MetaHTMLNode[];

type MetaHTMLNode = MetaHTMLElement | MetaHTMLText | MetaHTMLComment;

type MetaHTMLElement = {
  type: "Element";
  nodeName: string;
  attributes: Record<string, MetaAttributeValue>;
  children: MetaHTMLNode[];
  cssString: string;
  cssProperties: MetaCSSPropertiesNode[];
};

type MetaCSSPropertiesNode =
  | MetaCSSPropertiesConditionalNode
  | MetaCSSPropertiesConstantNode;

type MetaCSSPropertiesConstantNode = {
  type: "MetaCSSPropertiesConstantNode";
  cssPropertiesString: string;
};

type MetaCSSPropertiesConditionalNode = {
  type: "MetaCSSPropertiesConditionalNode";
  condition: string;
  cssPropertiesString: string;
};

type MetaHTMLText = { type: "Text"; value: string };

type MetaHTMLComment = { type: "Comment"; value: string };

function nodeToMetaHTMLNode(node: ChildNode): MetaHTMLNode {
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

  const cssString = getAllMatchingCSSRulesAsString(htmlElement, attributes);

  return {
    type: "Element",
    nodeName: htmlElement.nodeName,
    attributes,
    children: Array.from(node.childNodes).map(nodeToMetaHTMLNode),
    cssString,
    cssProperties: getAllMatchingCSSProperties(htmlElement, attributes),
  };
}

function getAllMatchingCSSRulesAsString(
  element: HTMLElement,
  attributes: MetaHTMLElement["attributes"]
): string {
  // Set ALL classes on element so we can find matching CSS rules.
  //
  // The htmlElement.className value looks like a string of,
  //   "thing {{ someId: class1 | class2 }} {{ someId: class3 as name1 | class4 as name2 }} "
  // so we want to turn that into a string of,
  //   "thing class1 class2 class3 class4"
  //
  // In CSS the :not() could mean that adding other classes invalidates rules but MetaTemplate
  // doesn't support that.

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

  const matchedCSS = cssSniff([element], { ignoreChildren: true });

  return serializeCSSMatches(matchedCSS);
}

function getAllMatchingCSSProperties(
  element: HTMLElement,
  attributes: MetaHTMLElement["attributes"]
): MetaCSSPropertiesNode[] {
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

  const cssProperties: MetaCSSPropertiesNode[] = [];

  resetElementAttributes(element, attributes);

  const resetMatchedCSS = cssSniff([element], { ignoreChildren: true });

  // TODO: extract properties of resetMatchedCSS

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
            // diff matchedCSS and resetMatchedCSS and extract cssProperties
            //
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
