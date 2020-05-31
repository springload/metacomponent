// MetaTemplate WebTemplateTranslator
import {
  parseMetaTemplateString,
  MetaTemplate,
} from "./metaTemplate/metaTemplate";
import { makeTemplates } from "./makeTemplates/makeTemplates";
import { TemplateFiles } from "./types";
import { logFactory } from "./log";

type Props = {
  domDocument: Document;
  templateId: string;
  metaHTMLString: string;
  cssString: string;
  haltOnErrors: boolean;
};

export type MetaTemplates = {
  metaTemplate: MetaTemplate;
  files: TemplateFiles;
};

export function generateTemplates({
  domDocument,
  templateId,
  metaHTMLString,
  cssString,
  haltOnErrors,
}: Props): MetaTemplates {
  const metaTemplate = parseMetaTemplateString({
    domDocument,
    metaHTMLString,
    cssString,
    log: logFactory(haltOnErrors),
  });

  return {
    metaTemplate,
    files: makeTemplates({ templateId, metaTemplate }),
  };
}
