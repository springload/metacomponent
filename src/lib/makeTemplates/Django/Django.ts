import { Template, TemplateFormat, OnConstructor } from "../Template";
import { TemplateFiles } from "../../types";
import { MetaAttributeValues } from "../../metaComponent/parseMetaHTMLAttribute";
import { stringToDjangoVar } from "../../metaComponent/parseMetaHTMLIf";
import { assertUnreachable } from "../utils";

export class DjangoTemplate extends Template {
  data: string;

  constructor(args: OnConstructor) {
    super({ ...args, dirname: "django" });
    this.data = "";
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
      attr += `{% if ${stringToDjangoVar(attributeVariable.id)} %}`;
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
              return `{{ ${stringToDjangoVar(attributeValue.id)} }}`;
            }
            case "MetaAttributeVariableOptions": {
              return Object.entries(attributeValue.options)
                .map(([optionName, optionValue], index, arr) => {
                  let exp = "";
                  if (index === 0) {
                    exp += `{% if `;
                  } else {
                    exp += `{% elif `;
                  }
                  exp += stringToDjangoVar(attributeValue.id);
                  exp += " == ";
                  exp += JSON.stringify(optionName);
                  exp += ` %}`;
                  exp += optionValue;
                  if (index === arr.length - 1) {
                    exp += `{% endif %}`;
                  }
                  return exp;
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
      attr += `{% endif %}`;
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
    this.data += `{% ${onComment.value} %}`;
  }

  onVariable(
    variable: Parameters<TemplateFormat["onVariable"]>[0]
  ): ReturnType<TemplateFormat["onVariable"]> {
    const prop = this.props[variable.id];

    if (!prop.required && variable.children.length > 0) {
      this.data += `{% if ${stringToDjangoVar(variable.id)} %}`;
    }
    this.data += `{{ ${stringToDjangoVar(variable.id)} }}`;
    if (!prop.required && variable.children.length > 0) {
      this.data += `{% else %}`;
    }
    if (prop.required) return true;
  }

  onCloseVariable(variable: Parameters<TemplateFormat["onVariable"]>[0]) {
    const prop = this.props[variable.id];

    if (!prop.required && variable.children.length > 0) {
      this.data += `{% endif %}`;
    }
  }

  onIf(onIf: Parameters<TemplateFormat["onIf"]>[0]) {
    if (onIf.parseError === false) {
      this.data += `{% ${onIf.testAsPythonExpression} %}`;
    }
  }

  onCloseIf(onCloseIf: Parameters<TemplateFormat["onCloseIf"]>[0]) {
    if (onCloseIf.parseError === false) {
      this.data += `{% endif %}`;
    }
  }

  onFinalise(onSerialize: Parameters<TemplateFormat["onFinalise"]>[0]) {
    // pass
  }

  serialize(): TemplateFiles {
    return {
      [`${this.dirname}/${this.templateId}.html`]: this.data,
    };
  }
}
