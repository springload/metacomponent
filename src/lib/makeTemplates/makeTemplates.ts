import { MetaTemplate } from "../metaTemplate/metaTemplate";
import { TemplateFiles } from "../types";

import { CSSTemplate } from "./CSS/CSS";
import { HTMLTemplate } from "./HTML/HTML";
import { ReactTemplate } from "./React/React";
import { Template, OnConstructor } from "./Template";

type MakeTemplatesProps = {
  templateId: string;
  metaTemplate: MetaTemplate;
};

export function makeTemplates({
  templateId,
  metaTemplate,
}: MakeTemplatesProps): TemplateFiles {
  const args: OnConstructor = {
    props: metaTemplate.props,
    templateId,
    hasMultipleRootNodes: metaTemplate.nodes.length > 1,
  };
  return mergeTemplateFiles(
    makeTemplate(templateId, metaTemplate, new HTMLTemplate(args)),
    makeTemplate(templateId, metaTemplate, new CSSTemplate(args)),
    makeTemplate(templateId, metaTemplate, new ReactTemplate(args))
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
      case "Variable": {
        instance.onVariable(node);
        break;
      }
      case "If": {
        instance.onIf(node);
        node.children.forEach(walk);
        instance.onCloseIf();
        break;
      }
    }
  }

  metaTemplate.nodes.forEach(walk);

  instance.onFinalise();

  return instance.serialize({ css: metaTemplate.cssString });
}
