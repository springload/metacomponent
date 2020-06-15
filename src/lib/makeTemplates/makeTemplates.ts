import { MetaComponent } from "../metaComponent/metaComponent";
import { TemplateFiles } from "../types";
import { Template, OnConstructor } from "./Template";

import { CSSTemplate } from "./CSS/CSS";
import { HTMLTemplate } from "./HTML/HTML";
import { ReactTemplate } from "./React/React";
import { ReactStyledComponentsTemplate } from "./ReactStyledComponents/ReactStyledComponents";
import { MustacheTemplate } from "./Mustache/Mustache";
import { VueTemplate } from "./Vue/Vue";
import { VueJSXTemplate } from "./Vue-JSX/Vue-JSX";
import { AngularTemplate } from "./Angular/Angular";
import { DjangoTemplate } from "./Django/Django";
import { EmberTemplate } from "./Ember/Ember";

type MakeTemplatesProps = {
  templateId: string;
  metaComponent: MetaComponent;
};

export function makeTemplates({
  templateId,
  metaComponent,
}: MakeTemplatesProps): TemplateFiles {
  const args: OnConstructor = {
    props: metaComponent.props,
    templateId,
    hasMultipleRootNodes: metaComponent.nodes.length > 1,
  };
  return mergeTemplateFiles(
    makeTemplate(templateId, metaComponent, new HTMLTemplate(args)),
    makeTemplate(templateId, metaComponent, new CSSTemplate(args)),
    makeTemplate(templateId, metaComponent, new MustacheTemplate(args)),
    makeTemplate(templateId, metaComponent, new DjangoTemplate(args)),
    makeTemplate(templateId, metaComponent, new ReactTemplate(args)),
    makeTemplate(
      templateId,
      metaComponent,
      new ReactStyledComponentsTemplate(args)
    ),
    makeTemplate(templateId, metaComponent, new VueTemplate(args)),
    makeTemplate(templateId, metaComponent, new VueJSXTemplate(args)),
    makeTemplate(templateId, metaComponent, new AngularTemplate(args)),
    makeTemplate(templateId, metaComponent, new EmberTemplate(args))
  );
}

function mergeTemplateFiles(...obj: TemplateFiles[]): TemplateFiles {
  return Object.assign({}, ...obj);
}

function makeTemplate(
  templateId: string,
  metaComponent: MetaComponent,
  instance: Template
) {
  function walk(node: MetaComponent["nodes"][number]) {
    switch (node.type) {
      case "Element": {
        const openingElement = instance.onElement(node);
        node.children.forEach(walk);
        instance.onCloseElement({ openingElement, children: node.children });
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
        const shouldNotRenderChildren = instance.onVariable(node);
        if (!shouldNotRenderChildren) {
          node.children.forEach(walk);
        }
        instance.onCloseVariable(node);
        break;
      }
      case "If": {
        instance.onIf(node);
        node.children.forEach(walk);
        instance.onCloseIf(node);
        break;
      }
    }
  }

  metaComponent.nodes.forEach(walk);

  instance.onFinalise({ css: metaComponent.cssString });

  return instance.serialize();
}
