import { MetaHTML } from "../metaHTML/metaHTML";
import { TemplateFiles } from "../types";

import { TemplateCSS } from "./TemplateCSS/TemplateCSS";
import { TemplateHTML } from "./TemplateHTML/TemplateHTML";

export function makeTemplate(
  templateId: string,
  metaHTML: MetaHTML
): TemplateFiles {
  const instance = new TemplateHTML({ templateId });

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
