import { Template, TemplateFormat, OnConstructor } from "../Template";
import { TemplateFiles } from "../../types";
import { MetaAttributeValues } from "../../metaComponent/parseMetaHTMLAttribute";
import { assertUnreachable } from "../utils";

export class MustacheTemplate extends Template {
  data: string;
  unescapedVariables: string[];

  constructor(args: OnConstructor) {
    super({ ...args, dirname: "mustache" });
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

    const isOmittedIfEmpty =
      attributeValues.length === 1 &&
      ["MetaAttributeVariable"].includes(attributeValues[0].type);

    if (isOmittedIfEmpty) {
      const attributeVariable = attributeValues[0];
      if (attributeVariable.type !== "MetaAttributeVariable") {
        throw Error(`Internal error`);
      }
      attr += `{{#${attributeVariable.id}}}`;
    }

    attr += name;

    if (attributeValues) {
      attr += '="';
      attr += attributeValues
        .map((attributeValue): string => {
          switch (attributeValue.type) {
            case "MetaAttributeConstant": {
              return attributeValue.value;
            }
            case "MetaAttributeVariable": {
              return `{{${attributeValue.id}}}`;
            }
            case "MetaAttributeVariableOptions": {
              // Because Mustache is "logic-less" we can't have
              // if (x === 1) { result1 } else if (x === 2) { result2 } endif;
              // we can only have truthy results, so we instead we use the fact
              // that the "=" character is a valid part of a variable name and
              // we make variables for each possible enumeration. So when
              // comparing a variable of "x" for a value of "1" we instead check
              // for a variable named "x=1" literally. So now the code looks like,
              // if (x=1) { result1 } endif; if(x=2) { result2 } endif;
              return Object.entries(attributeValue.options)
                .map(([optionName, optionValue]) => {
                  return `{{${attributeValue.id}=${optionName}}}${optionValue}{{/${attributeValue.id}=${optionName}}}`;
                })
                .join("");
            }
          }
          return assertUnreachable();
        })
        .join("")
        .trim();

      attr += '"';
    }

    if (isOmittedIfEmpty) {
      const attributeVariable = attributeValues[0];
      if (attributeVariable.type !== "MetaAttributeVariable") {
        throw Error(`Internal error`);
      }
      attr += `{{/${attributeVariable.id}}}`;
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
    this.data += `{{! ${onComment.value} }}`;
  }

  onVariable(
    variable: Parameters<TemplateFormat["onVariable"]>[0]
  ): ReturnType<TemplateFormat["onVariable"]> {
    this.unescapedVariables.push(variable.id);
    this.data += `{{{ ${variable.id} }}}`;
    if (variable.children.length > 0) {
      this.data += `{{^${variable.id}}}`;
    }
  }

  onCloseVariable(closeVariable: Parameters<TemplateFormat["onVariable"]>[0]) {
    if (closeVariable.children.length > 0) {
      this.data += `{{/${closeVariable.id}}}`;
    }
  }

  onIf(onIf: Parameters<TemplateFormat["onIf"]>[0]) {
    if (onIf.parseError === false) {
      this.data += `{{#${this.renderIf(onIf.testAsJavaScriptExpression)}}}`;
    }
  }

  renderIf(expression: string): string {
    return expression.replace(/[\s"']/gi, "").replace(/[=]+/g, "=");
  }

  onCloseIf(onCloseIf: Parameters<TemplateFormat["onCloseIf"]>[0]) {
    if (onCloseIf.parseError === false) {
      this.data += `{{/${this.renderIf(
        onCloseIf.testAsJavaScriptExpression
      )}}}`;
    }
  }

  onFinalise(onSerialize: Parameters<TemplateFormat["onFinalise"]>[0]) {
    let unescaped = "";
    if (this.unescapedVariables.length) {
      unescaped = `{{!\nDEVELOPER NOTE: This template uses triple-bracket "{{{" which disables HTML escaping.\nPlease ensure these variables are properly escaped:\n\n  * ${this.unescapedVariables.join(
        ",\n  * "
      )}.\n\nThe reason for this is to allow raw HTML, for values such as (eg) <span lang="mi">Māori</span>.\n}}\n`;
    }
    this.data = `${unescaped}${this.data}`;
  }

  serialize(): TemplateFiles {
    return {
      [`${this.dirname}/${this.templateId}.html`]: this.data,
    };
  }
}
