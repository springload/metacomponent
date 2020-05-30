import { Template, TemplateFormat, OnConstructor } from "../Template";
import { TemplateFiles } from "../../types";

export class HTMLTemplate extends Template {
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
    Object.keys(attributes).forEach((name) => {
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

  onComment = (onComment: Parameters<TemplateFormat["onComment"]>[0]): void => {
    const { value } = onComment;
    this.html += `<!--${value}-->`;
  };

  serialize = (
    onSerialize: Parameters<TemplateFormat["serialize"]>[0]
  ): TemplateFiles => {
    return {
      [`${this.dirname}/${this.templateId}.html`]: this.html,
    };
  };
}

// Via http://xahlee.info/js/html5_non-closing_tag.html
export const SELF_CLOSING_HTML_ELEMENTS = [
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
];
