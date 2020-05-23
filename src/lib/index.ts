// MetaTemplate WebTemplateTranslator

import { parseMetaHTMLString } from "./metaHTML/metaHTML";

export async function makeTemplates(
  dom: Window,
  metaHTMLString: string,
  cssString: string
): Promise<Files> {
  const metaHtml = parseMetaHTMLString(dom, metaHTMLString, cssString);
  return;
}

export type Files = Record<string, string>; // {"path/path": "data"}
