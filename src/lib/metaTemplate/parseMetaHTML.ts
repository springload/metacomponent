import { Log } from "../log";
// Combine metaHTML and CSS in an HTML document string, and restore parsing mode
// problems.
//
// Some tags like <select> and <tbody> etc., invoke HTML5 parsing modes
// that only allow certain tags within them, or they rearrange the tree
// based on those tags, so we need to alias them. See
// https://www.w3.org/TR/2011/WD-html5-20110113/parsing.html#the-insertion-mode
// So that would mean we couldn't have tags like,
//
// <select>
//   <mt-variable key="children">placeholder</mt-variable>
// </select>
//
// So instead we'll turn that into,
//
// <mt-alias-select>
//   <mt-variable key="children">placeholder</mt-variable>
// </mt-alias-select>
//
// and rename the element after parsing

type Props = {
  domDocument: Document;
  metaHTMLString: string;
  cssString: string;
  log: Log;
};

export function parseHTMLWithoutInsertionMode({
  domDocument,
  metaHTMLString,
  cssString,
  log,
}: Props): void {
  const documentString = wrapBodyHtml(metaHTMLString, cssString);
  domDocument.documentElement.innerHTML = documentString;

  restoreParsingModeElements(domDocument, log);
  moveChildlessElements(domDocument);
}

function wrapBodyHtml(metaHTMLString: string, cssString: string): string {
  return `<head><style>${cssString}</style></head><body>${aliasParsingModeElements(
    metaHTMLString
  )}</body>`;
}

const MT_ALIAS_TAG = "mt-";
const MT_ALIAS_ATTR = "data-mt-original-element-name";

function aliasParsingModeElements(html: string): string {
  const parsingModeTags = [
    "table",
    "thead",
    "tbody",
    "tfoot",
    "tr",
    "caption",
    "select",
    "option",
  ];

  return html.replace(/<([/]?)([^ >]+)/gi, (match, closingTag, tagName) => {
    const isClosingTag = !!closingTag;
    let response = `<${isClosingTag ? "/" : ""}`;
    if (parsingModeTags.includes(tagName)) {
      response += MT_ALIAS_TAG;
      if (!isClosingTag) {
        response += ` ${MT_ALIAS_ATTR}="${tagName}" `;
      }
    } else {
      response += tagName;
    }
    return response;
  });
}

function restoreParsingModeElements(domDocument: Document, log: Log): void {
  const doc = domDocument;
  const aliases = Array.from(doc.querySelectorAll(MT_ALIAS_TAG));
  aliases.forEach((alias: Element) => {
    if (!alias) return;
    const tagName = alias.getAttribute(MT_ALIAS_ATTR);
    if (!tagName) {
      log(`MetaTemplate: ${MT_ALIAS_TAG} missing ${MT_ALIAS_ATTR} attribute.`);
      return;
    }
    const childNodes = Array.from(alias.childNodes);
    const unaliased = doc.createElement(tagName);
    if (!alias.parentNode) {
      log("MetaTemplate parsing mode element must not be top-level.");
      return;
    }
    alias.parentNode.insertBefore(unaliased, alias);
    childNodes.forEach((childNode) => {
      unaliased.appendChild(childNode);
    });
    const attrs = alias.getAttributeNames().filter(
      (name) => name.toLowerCase() !== MT_ALIAS_ATTR.toLowerCase() // because DOMs can lowercase attributes so we need a case-insensitive string comparison
    );
    attrs.forEach((attr) => {
      const previousAttributeValue = alias.getAttribute(attr);
      if (!previousAttributeValue) {
        log("MetaTemplate: must have a previous attribute value");
        return;
      }
      unaliased.setAttribute(attr, previousAttributeValue);
    });
    alias.parentNode.removeChild(alias);
  });
}

function moveChildlessElements(domDocument: Document) {
  const childlessElementNames = ["mt-variable"];
  childlessElementNames.forEach((childlessElementName: string): void => {
    Array.from(domDocument.querySelectorAll(childlessElementName)).forEach(
      (childlessElement: Element) => {
        while (childlessElement.lastChild) {
          childlessElement.parentNode?.insertBefore(
            childlessElement.lastChild,
            childlessElement.nextElementSibling
          );
        }
      }
    );
  });
}
