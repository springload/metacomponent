import startCase from "lodash/startCase";
import prettier from "prettier/standalone";
import parserAngular from "prettier/parser-angular";
import { Template, TemplateFormat, OnConstructor } from "../Template";
import { TemplateFiles } from "../../types";
import {
  MetaAttributeValues,
  MetaAttributeValue,
} from "../../metaComponent/parseMetaHTMLAttribute";
import { validJavaScriptIdentifer } from "../utils";

type ComputedProp = {
  identifiers: string[];
  expression: string;
  responseType: "string" | "boolean";
};

export class VueTemplate extends Template {
  template: string;
  script: string;
  style: string;

  imports: string;
  extendPropsString: string;
  propsString: string;
  computed: Record<string, ComputedProp>;

  finalData: string;

  constructor(args: OnConstructor) {
    super({ ...args, dirname: args.dirname || "vue" });

    this.template = "";
    this.script = "";
    this.style = "";

    this.imports = "";
    this.propsString = "";
    this.extendPropsString = "";
    this.computed = {};

    this.finalData = "";

    this.setPropsString = this.setPropsString.bind(this);
    this.renderPropType = this.renderPropType.bind(this);
    this.setImports = this.setImports.bind(this);
    this.renderAttribute = this.renderAttribute.bind(this);
    this.getNewComputedName = this.getNewComputedName.bind(this);

    this.setPropsString();
    this.setImports();
  }

  setPropsString() {
    this.propsString = Object.keys(this.props)
      .map((propId) => {
        return this.renderPropType(propId) + ";";
      })
      .join("\n  ");

    this.extendPropsString = Object.keys(this.props)
      .map((propId) => {
        return `${
          validJavaScriptIdentifer.test(propId)
            ? propId
            : JSON.stringify(propId)
        }: Object as () => Props[${JSON.stringify(propId)}],`;
      })
      .join("\n    ");
  }

  setImports() {
    this.imports += `import Vue from "vue";'\n`;
  }

  renderPropType(propId: string): string {
    const prop = this.props[propId];
    let propString = "";

    propString += validJavaScriptIdentifer.test(propId)
      ? propId
      : JSON.stringify(propId);

    if (!prop.required) {
      propString += "?";
    }

    propString += ": ";

    switch (prop.type) {
      case "PropTypeVariable": {
        propString += "Vue.VNode";
        break;
      }
      case "PropTypeAttributeValue": {
        propString += `string`;
        break;
      }
      case "PropTypeAttributeValueOptions": {
        propString += `${Object.keys(prop.options)
          .map((key) => {
            return validJavaScriptIdentifer.test(key) ? `"${key}"` : `"${key}"`;
          })
          .join(" | ")}`;
      }
    }

    return propString;
  }

  renderRenderFunction() {
    const propIds = Object.keys(this.props);
    const containsInvalidIdentifiers = propIds.some(
      (propId) => !validJavaScriptIdentifer.test(propId)
    );
    if (containsInvalidIdentifiers) {
      this.template += `export default function ${this.templateId}(props: Props){\n`;
      const destructure = propIds
        .filter((key) => validJavaScriptIdentifer.test(key))
        .join(", ");
      if (destructure) {
        this.template += `  const { ${destructure} } = props;\n`;
      }
    } else {
      this.template += `export default function ${
        this.templateId
      }({ ${propIds.join(", ")} }: Props){\n`;
    }
    this.template += `  return (\n`;
  }

  onElement(
    onElement: Parameters<TemplateFormat["onElement"]>[0]
  ): ReturnType<TemplateFormat["onElement"]>[0] {
    const { nodeName, attributes } = onElement;
    this.template += `<${nodeName}`;
    this.template += Object.keys(attributes)
      .map((attributeName): string =>
        this.renderAttribute(attributeName, attributes[attributeName])
      )
      .join(" ");
    if (onElement.children.length === 0) {
      this.template += "/";
    }
    this.template += ">";
    return nodeName;
  }

  renderAttribute(
    attributeName: string,
    attributeValues: MetaAttributeValues
  ): string {
    // TODO: escape attribute values and keys

    const containsOnlyConstants = attributeValues.every(
      (attributeValue) => attributeValue.type === "MetaAttributeConstant"
    );

    let response = "";

    response += ` ${!containsOnlyConstants ? ":" : ""}${attributeName}="`;

    if (containsOnlyConstants) {
      response += attributeValues
        .map((attributeValue) => {
          if (attributeValue.type === "MetaAttributeConstant") {
            return attributeValue.value;
          }
          throw new Error(
            "Internal error. Didn't expect type " + attributeValue.type
          );
        })
        .join("");
    } else {
      const computedName = this.getNewComputedName(attributeName);

      const containsExpression = attributeValues.some(
        (attributeValue) => attributeValue.type !== "MetaAttributeConstant"
      );
      const containsConstant = attributeValues.some(
        (attributeValue) => attributeValue.type === "MetaAttributeConstant"
      );

      const computedProp: ComputedProp = this.computed[computedName] || {
        identifiers: [],
        expression: containsExpression && containsConstant ? "`" : "",
        responseType: "string",
      };

      this.computed[computedName] = computedProp;

      attributeValues.forEach((attributeValue) => {
        if (
          containsConstant &&
          attributeValue.type !== "MetaAttributeConstant"
        ) {
          computedProp.expression += "${ ";
        }
        const [propExpression, propId] = this.renderAttributeValue(
          attributeValue
        );
        if (propId) {
          computedProp.identifiers.push(propId);
        }
        computedProp.expression += propExpression;
        if (
          containsConstant &&
          attributeValue.type !== "MetaAttributeConstant"
        ) {
          computedProp.expression += " || '' }";
        }
      });

      if (containsExpression && containsConstant) {
        computedProp.expression += "`";
      }

      this.computed[computedName] = computedProp;
      response += computedName;
    }

    response += '"';

    return response;
  }

  getNewComputedName(name: string): string {
    let counter = 1;
    let computedName = "";
    do {
      computedName = `computed${startCase(name)
        .replace(/\s/gi, "")
        .substring(0, 1)
        .toUpperCase()}${name.substring(1)}${
        counter === 1 ? "" : `${counter}`
      }`;
      counter++;
    } while (this.computed[computedName] !== undefined);
    return computedName;
  }

  renderAttributeValue(attributeValue: MetaAttributeValue): [string, string?] {
    switch (attributeValue.type) {
      case "MetaAttributeConstant": {
        return [attributeValue.value, undefined];
      }
      case "MetaAttributeVariable": {
        return [
          validJavaScriptIdentifer.test(attributeValue.id)
            ? attributeValue.id
            : `props["${attributeValue.id}"]`,
          attributeValue.id,
        ];
      }
      case "MetaAttributeVariableOptions": {
        const identifier = validJavaScriptIdentifer.test(attributeValue.id)
          ? attributeValue.id
          : `props["${attributeValue.id}"]`;

        if (!this.props[attributeValue.id].required) {
          this.template += `${identifier} && `;
        }
        return [
          `${JSON.stringify(attributeValue.options)}[${identifier}]`,
          attributeValue.id,
        ];
      }
    }
  }

  onCloseElement(
    onCloseElement: Parameters<TemplateFormat["onCloseElement"]>[0]
  ): void {
    const { openingElement } = onCloseElement;
    this.template += `</${openingElement}>`;
  }

  onText(onText: Parameters<TemplateFormat["onText"]>[0]): void {
    const { value } = onText;
    this.template += value;
  }

  onComment(onComment: Parameters<TemplateFormat["onComment"]>[0]): void {
    const { value } = onComment;
    this.template += `<!--${value}-->`;
  }

  onVariable(
    variable: Parameters<TemplateFormat["onVariable"]>[0]
  ): ReturnType<TemplateFormat["onVariable"]> {
    const prop = this.props[variable.id];

    if (variable.id === "children") {
      this.template += `<slot>`; // treat 'children' as default slot
    } else {
      this.template += `<slot name=${JSON.stringify(variable.id)}>`;
    }
    if (prop.required) return true;
  }

  onCloseVariable(variable: Parameters<TemplateFormat["onCloseVariable"]>[0]) {
    this.template += `</slot>`;
  }

  onIf(onIf: Parameters<TemplateFormat["onIf"]>[0]) {
    if (onIf.parseError === false) {
      const computedName = this.getNewComputedName(onIf.ids.join(" "));
      this.computed[computedName] = {
        identifiers: onIf.ids,
        expression: onIf.testAsJavaScriptExpression,
        responseType: "boolean",
      };
      this.template += `<span v-if="${computedName}">`;
    } else {
      this.template += `<!-- parse error: ${onIf.error} -->`;
    }
  }

  onCloseIf(onCloseIf: Parameters<TemplateFormat["onCloseIf"]>[0]) {
    this.template += `</span>`;
  }

  onFinalise(onFinalise: Parameters<TemplateFormat["onFinalise"]>[0]) {
    const { css } = onFinalise;

    const computedString = Object.keys(this.computed)
      .map((propName) => {
        const computedProp = this.computed[propName];
        const containsInvalidIdentifiers = computedProp.identifiers.some(
          (identifier) => !validJavaScriptIdentifer.test(identifier)
        );
        const spreadProps = computedProp.identifiers
          .filter((identifier) => validJavaScriptIdentifer.test(identifier))
          .join(", ");

        let computeFunction = "(";
        if (containsInvalidIdentifiers) {
          computeFunction += `props: Props): ${computedProp.responseType} => `;
          if (spreadProps) {
            computeFunction += "{";
            computeFunction += `      const { ${spreadProps} } = props;\n`;
            computeFunction += `      return `;
          } else {
            computeFunction += "(";
          }
        } else {
          computeFunction += `{${spreadProps}}: Props): ${computedProp.responseType} => (`;
        }

        computeFunction += computedProp.expression;

        if (containsInvalidIdentifiers && spreadProps) {
          computeFunction += "}";
        } else {
          computeFunction += ")";
        }

        return `${propName}: ${computeFunction}`;
      })
      .join(",\n    ");

    const componentVarName = startCase(this.templateId).replace(/\s/gi, "");

    this.script = "";

    if (this.propsString) {
      this.script += `type Props = {\n  ${this.propsString}\n};\n\n`;
    }

    this.script += `const ${componentVarName} = Vue.extend({\n`;
    if (this.extendPropsString) {
      this.script += "  props: {\n    ";
      this.script += this.extendPropsString;
      this.script += "\n  },\n";
    }
    if (computedString) {
      this.script += `  computed: {\n`;
      this.script += `    ${computedString}\n`;
      this.script += `  }\n`;
    }
    this.script += `});\n`;
    this.script += `export default ${componentVarName};`;

    this.finalData = `<template>\n${this.template}\n</template>\n`;
    if (css) {
      this.finalData += `<style scoped>\n${css}\n</style>\n`;
    }
    this.finalData += `<script lang="ts">\n${this.imports}\n\n${this.script}\n</script>\n`;

    try {
      this.finalData = prettier.format(this.finalData, {
        parser: "vue",
        printWidth: 80,
        plugins: [parserAngular], // Vue uses Angular's parser https://prettier.io/blog/2018/11/07/1.15.0.html
      });
    } catch (e) {
      // pass
    }
  }

  serialize(): TemplateFiles {
    return {
      [`${this.dirname}/${this.templateId}.vue`]: this.finalData,
    };
  }
}
