import { MetaHTML } from "../metaHTML/metaHTML";
import { TemplateFiles } from "../types";

import { TemplateCSS } from "./TemplateCSS/TemplateCSS";
import { TemplateHTML } from "./TemplateHTML/TemplateHTML";
import { TemplateFormat } from "./TemplateFormat";

export function makeTemplates(
  componentId: string,
  metaHTML: MetaHTML
): TemplateFiles {
  return mergeTemplateFiles(
    makeTemplate(componentId, metaHTML, new TemplateHTML({ componentId })),
    makeTemplate(componentId, metaHTML, new TemplateCSS({ componentId }))
  );
}

function mergeTemplateFiles(...obj: TemplateFiles[]): TemplateFiles {
  return Object.assign({}, ...obj);
}

function makeTemplate(
  componentId: string,
  metaHTML: MetaHTML,
  instance: TemplateFormat
) {
  function walk(node: MetaHTML["nodes"][number]) {
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

  metaHTML.nodes.forEach(walk);

  return instance.serialize({ css: metaHTML.cssString });
}
