// MetaTemplate WebTemplateTranslator

import { parseMetaHTMLString } from "./metaHTML/metaHTML";
import { makeTemplate } from "./makeTemplate/makeTemplate";
import { TemplateFiles } from "./types";

export default async function MetaTemplate(
  dom: Window,
  templateId: string,
  metaHTMLString: string,
  cssString: string
): Promise<TemplateFiles> {
  const metaHTML = parseMetaHTMLString(dom, metaHTMLString, cssString);

  console.log(JSON.stringify(metaHTML, null, 2));

  return makeTemplate(templateId, metaHTML);
}
