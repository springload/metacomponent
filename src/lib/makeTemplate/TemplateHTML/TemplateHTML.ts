import prettier from "prettier";
import { Template, TemplateFormat, OnConstructor } from "../TemplateFormat";
import { TemplateFiles } from "../../types";

export class TemplateHTML extends Template {
  html: string;

  constructor(args: OnConstructor) {
    super({ templateId: args.templateId, dirname: "html" });

    this.html = "";
  }

  onElement = (
    onElement: Parameters<TemplateFormat["onElement"]>[0]
  ): ReturnType<TemplateFormat["onElement"]>[0] => {
    const { nodeName, attributes } = onElement;

    this.html += `<${nodeName}`;
    Object.keys(attributes).map((name) => {
      const attributeValues = attributes[name];
      this.html += ` ${name}="${attributeValues
        .map((attributeValue) => {
          if (attributeValue.type === "MetaAttributeConstant") {
            return attributeValue.value;
          } else if (attributeValue.type === "MetaAttributeVariableOptions") {
            const firstKey = Object.keys(attributeValue.options)[0];
            return attributeValue.options[firstKey];
          }
          return "";
        })
        .filter((value) => value.length > 0)
        .join(" ")}"`;
    });
    this.html += ">";

    return nodeName;
  };

  onCloseElement = (
    onCloseElement: Parameters<TemplateFormat["onCloseElement"]>[0]
  ): void => {
    const { openingElement } = onCloseElement;
    this.html += `</${openingElement}>`;
  };

  onText = (onText: Parameters<TemplateFormat["onText"]>[0]): void => {
    const { value } = onText;
    this.html += value;
  };

  serialize = (
    onSerialize: Parameters<TemplateFormat["serialize"]>[0]
  ): TemplateFiles => {
    const formattedHTML = prettier.format(this.html, {
      parser: "html",
    });

    return {
      [`${this.dirname}/${this.templateId}.html`]: formattedHTML,
    };
  };
}
