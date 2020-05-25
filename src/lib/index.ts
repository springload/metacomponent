// MetaTemplate WebTemplateTranslator

import { parseMetaHTMLString, MetaHTML } from "./metaHTML/metaHTML";
import { makeTemplates } from "./makeTemplates/makeTemplates";
import { TemplateFiles } from "./types";

export default function MetaTemplate(
  domDocument: Document,
  templateId: string,
  metaHTMLString: string,
  cssString: string
): { metaHTML: MetaHTML; files: TemplateFiles } {
  const metaHTML = parseMetaHTMLString(domDocument, metaHTMLString, cssString);
  const files = makeTemplates(templateId, metaHTML);

  return {
    metaHTML,
    files,
  };
}
