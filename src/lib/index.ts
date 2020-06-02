// MetaComponent WebTemplateTranslator
import {
  parseMetaComponentString,
  MetaComponent,
} from "./metaComponent/metaComponent";
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

export type MetaComponents = {
  metaComponent: MetaComponent;
  files: TemplateFiles;
};

export function generateTemplates({
  domDocument,
  templateId,
  metaHTMLString,
  cssString,
  haltOnErrors,
}: Props): MetaComponents {
  const metaComponent = parseMetaComponentString({
    domDocument,
    metaHTMLString,
    cssString,
    log: logFactory(haltOnErrors),
  });

  return {
    metaComponent,
    files: makeTemplates({ templateId, metaComponent }),
  };
}
