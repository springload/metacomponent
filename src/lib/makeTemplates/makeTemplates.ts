import { MetaTemplate } from "../metaTemplate/metaTemplate";
import { TemplateFiles } from "../types";

import { CSSTemplate } from "./CSS/CSS";
import { HTMLTemplate } from "./HTML/HTML";
import { Template } from "./Template";

type MakeTemplatesProps = {
  templateId: string;
  metaTemplate: MetaTemplate;
};

export function makeTemplates({
  templateId,
  metaTemplate,
}: MakeTemplatesProps): TemplateFiles {
  return mergeTemplateFiles(
    makeTemplate(templateId, metaTemplate, new HTMLTemplate({ templateId })),
    makeTemplate(templateId, metaTemplate, new CSSTemplate({ templateId }))
  );
}

function mergeTemplateFiles(...obj: TemplateFiles[]): TemplateFiles {
  return Object.assign({}, ...obj);
}

function makeTemplate(
  templateId: string,
  metaTemplate: MetaTemplate,
  instance: Template
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
