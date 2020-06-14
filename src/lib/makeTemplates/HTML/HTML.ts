import prettier from "prettier/standalone";
import parserHTML from "prettier/parser-html";
import { Template, TemplateFormat, OnConstructor } from "../Template";
import { TemplateFiles } from "../../types";

export class HTMLTemplate extends Template {
  html: string;

  constructor(args: OnConstructor) {
    super({ ...args, dirname: "html" });
    this.html = "";
  }

  onElement(
    onElement: Parameters<TemplateFormat["onElement"]>[0]
  ): ReturnType<TemplateFormat["onElement"]>[0] {
    const { nodeName, attributes } = onElement;

    this.html += `<${nodeName}`;
    Object.keys(attributes).forEach((name) => {
      const attributeValues = attributes[name];
      this.html += ` ${name}="${attributeValues
        .map((attributeValue) => {
          if (attributeValue.type === "MetaAttributeConstant") {
            return attributeValue.value;
          } else if (attributeValue.type === "MetaAttributeVariableOptions") {
            const optionKeys = Object.keys(attributeValue.options);
            if (optionKeys.length > 0) {
              const firstKey = optionKeys[0];
              const firstValue = attributeValue.options[firstKey];
              return firstValue;
            }
            return "";
          }
          return "";
        })
        .filter((value) => value.length > 0)
        .join("")}"`;
    });
    this.html += ">";
    return nodeName;
  }

  onCloseElement(
    onCloseElement: Parameters<TemplateFormat["onCloseElement"]>[0]
  ) {
    const { openingElement } = onCloseElement;
    this.html += `</${openingElement}>`;
  }

  onText(onText: Parameters<TemplateFormat["onText"]>[0]): void {
    const { value } = onText;
    this.html += value;
  }

  onComment(onComment: Parameters<TemplateFormat["onComment"]>[0]): void {
    const { value } = onComment;
    this.html += `<!--${value}-->`;
  }

  onVariable(
    variable: Parameters<TemplateFormat["onVariable"]>[0]
  ): ReturnType<TemplateFormat["onVariable"]> {
    const prop = this.props[variable.id];

    this.html += `<!-- '${variable.id}' goes here -->`;

    if (prop.required) return true;
  }

  onCloseVariable(closeVariable: Parameters<TemplateFormat["onVariable"]>[0]) {
    // pass
  }

  onIf(onIf: Parameters<TemplateFormat["onIf"]>[0]) {
    // pass
  }

  onCloseIf(onIf: Parameters<TemplateFormat["onCloseIf"]>[0]) {
    // pass
  }

  onFinalise(onFinalise: Parameters<TemplateFormat["onFinalise"]>[0]) {
    try {
      this.html = prettier.format(this.html, {
        parser: "html",
        printWidth: 80,
        plugins: [parserHTML],
      });
    } catch (e) {
      // pass
    }
  }

  serialize(): TemplateFiles {
    return {
      [`${this.dirname}/${this.templateId}.html`]: this.html,
    };
  }
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
