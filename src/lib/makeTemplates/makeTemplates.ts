import { MetaTemplate } from "../metaTemplate/metaTemplate";
import { TemplateFiles } from "../types";

import { CSS } from "./CSS/CSS";
import { HTML } from "./HTML/HTML";
import { TemplateFormat } from "./TemplateFormat";

type MakeTemplatesProps = {
  templateId: string;
  metaTemplate: MetaTemplate;
};

export function makeTemplates({
  templateId,
  metaTemplate,
}: MakeTemplatesProps): TemplateFiles {
  return mergeTemplateFiles(
    makeTemplate(templateId, metaTemplate, new HTML({ templateId })),
    makeTemplate(templateId, metaTemplate, new CSS({ templateId }))
  );
}

function mergeTemplateFiles(...obj: TemplateFiles[]): TemplateFiles {
  return Object.assign({}, ...obj);
}

function makeTemplate(
  templateId: string,
  metaTemplate: MetaTemplate,
  instance: TemplateFormat
) {
  function walk(node: MetaTemplate["nodes"][number]) {
    switch (node.type) {
      case "Element": {
        const openingElement = instance.onElement(node);
        node.children.forEach(walk);
        instance.onCloseElement({ openingElement });
        break;
      }
      case "Text": {
        instance.onText(node);
        break;
      }
      case "Comment": {
        instance.onComment(node);
        break;
      }
    }
  }

  metaTemplate.nodes.forEach(walk);

  return instance.serialize({ css: metaTemplate.cssString });
}
