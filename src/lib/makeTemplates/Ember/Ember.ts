import { Template, TemplateFormat, OnConstructor } from "../Template";
import { TemplateFiles } from "../../types";
import { MetaAttributeValues } from "../../metaComponent/parseMetaHTMLAttribute";
import { assertUnreachable } from "../utils";

export class EmberTemplate extends Template {
  data: string;
  unescapedVariables: string[];

  constructor(args: OnConstructor) {
    super({ ...args, dirname: "ember" });
    this.data = "";
    this.unescapedVariables = [];
  }

  onElement(
    onElement: Parameters<TemplateFormat["onElement"]>[0]
  ): ReturnType<TemplateFormat["onElement"]>[0] {
    const { nodeName, attributes } = onElement;

    this.data += `<${nodeName}`;
    Object.keys(attributes).forEach((name) => {
      const attributeValues = attributes[name];
      this.data += this.renderAttribute(name, attributeValues);
    });
    this.data += ">";
    return nodeName;
  }

  renderAttribute(name: string, attributeValues: MetaAttributeValues): string {
    let attr = " ";

    const containsSingleVariable =
      attributeValues.length === 1 &&
      attributeValues[0].type === "MetaAttributeVariable";

    attr += name;

    if (attributeValues) {
      attr += "=";
      if (!containsSingleVariable) {
        attr += '"';
      }
      attr += attributeValues
        .map((attributeValue): string => {
          switch (attributeValue.type) {
            case "MetaAttributeConstant": {
              return attributeValue.value;
            }
            case "MetaAttributeVariable": {
              return `{{@${attributeValue.id}}}`;
            }
            case "MetaAttributeVariableOptions": {
              return Object.entries(attributeValue.options)
                .map(([optionName, optionValue]) => {
                  return `{{if (eq ${attributeValue.id} ${JSON.stringify(
                    optionName
                  )})}}${optionValue}{{/if}}`;
                })
                .join("");
            }
          }
          return assertUnreachable();
        })
        .join("")
        .trim();

      if (!containsSingleVariable) {
        attr += '"';
      }
    }

    return attr;
  }

  onCloseElement(args: Parameters<TemplateFormat["onCloseElement"]>[0]): void {
    this.data += `</${args.openingElement}>`;
  }

  onText(onText: Parameters<TemplateFormat["onText"]>[0]): void {
    this.data += onText.value;
  }

  onComment(onComment: Parameters<TemplateFormat["onComment"]>[0]): void {
    this.data += `<!-- ${onComment.value} -->`;
  }

  onVariable(
    variable: Parameters<TemplateFormat["onVariable"]>[0]
  ): ReturnType<TemplateFormat["onVariable"]> {
    const prop = this.props[variable.id];

    this.unescapedVariables.push(variable.id);

    if (prop.required) {
      this.data += `{{@${variable.id}}}`;
    } else {
      this.data += `{{#if ${variable.id}}}`;
      this.data += `{{@${variable.id}}}`;
      if (variable.children.length > 0) {
        this.data += `{{else}}`;
      }
    }
    if (prop.required) return true;
  }

  onCloseVariable(variable: Parameters<TemplateFormat["onVariable"]>[0]) {
    const prop = this.props[variable.id];

    if (!prop.required && variable.children.length > 0) {
      this.data += `{{/${variable.id}}}`;
    }
  }

  onIf(onIf: Parameters<TemplateFormat["onIf"]>[0]) {
    if (onIf.parseError === false) {
      this.data += `{{#if @${this.renderIf(onIf.testAsJavaScriptExpression)}}}`;
    }
  }

  renderIf(expression: string): string {
    return expression.replace(/[\s"']/gi, "").replace(/[=]+/g, "=");
  }

  onCloseIf(onCloseIf: Parameters<TemplateFormat["onCloseIf"]>[0]) {
    if (onCloseIf.parseError === false) {
      this.data += `{{/if}}`;
    }
  }

  onFinalise(onSerialize: Parameters<TemplateFormat["onFinalise"]>[0]) {
    let unescaped = "";
    this.data = `${unescaped}${this.data}`;
  }

  serialize(): TemplateFiles {
    return {
      [`${this.dirname}/${this.templateId}.hbs`]: this.data,
    };
  }
}
