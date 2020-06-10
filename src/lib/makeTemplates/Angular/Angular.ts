import startCase from "lodash/startCase";
import prettier from "prettier/standalone";
import parserTypeScript from "prettier/parser-typescript";
import { Template, TemplateFormat, OnConstructor } from "../Template";
import { TemplateFiles } from "../../types";
import {
  MetaAttributeValues,
  MetaAttributeValue,
} from "../../metaComponent/parseMetaHTMLAttribute";
import { validJavaScriptIdentifer } from "../utils";

export class AngularTemplate extends Template {
  template: string;
  script: string;
  style: string;

  imports: string;
  typeScript: string;

  finalData: string;

  constructor(args: OnConstructor) {
    super({ ...args, dirname: args.dirname || "angular" });

    this.template = "";
    this.script = "";
    this.style = "";

    this.imports = "";
    this.typeScript = "";

    this.finalData = "";

    this.setTypeScript = this.setTypeScript.bind(this);
    this.renderPropType = this.renderPropType.bind(this);
    this.setImports = this.setImports.bind(this);
    this.renderAttribute = this.renderAttribute.bind(this);

    this.setTypeScript();
    this.setImports();
  }

  setTypeScript() {
    const props = Object.keys(this.props).map(this.renderPropType).join("\n  ");
    this.typeScript = `type Props = {\n  ${props}\n};`;
  }

  setImports() {
    this.imports += `import { Component } from "@angular/core";'\n`;
  }

  renderPropType(propId: string): string {
    const prop = this.props[propId];
    let propString = "";

    propString += validJavaScriptIdentifer.test(propId)
      ? propId
      : `"${propId}"`;

    if (!prop.required) {
      propString += "?";
    }

    propString += ": ";

    switch (prop.type) {
      case "PropTypeVariable": {
        propString += "any;";
        break;
      }
      case "PropTypeAttributeValue": {
        propString += `any;`;
        break;
      }
      case "PropTypeAttributeValueOptions": {
        propString += `${Object.keys(prop.options)
          .map((key) => {
            return validJavaScriptIdentifer.test(key) ? `"${key}"` : `"${key}"`;
          })
          .join(" | ")};`;
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

    this.template += ">";
    return nodeName;
  }

  renderAttribute(
    attributeName: string,
    attributeValues: MetaAttributeValues
  ): string {
    if (
      isFunctionReference(attributeName) &&
      attributeValues.length === 1 &&
      attributeValues[0].type === "MetaAttributeVariable"
    ) {
      const firstValue = attributeValues[0];
      if (firstValue.type !== "MetaAttributeVariable") {
        // TS narrowing
        throw Error("Internal error");
      }

      const valueAsString = JSON.stringify(firstValue.id);
      return ` (${attributeName.substring(2)})=${valueAsString.substring(
        0,
        valueAsString.length - 1
      )}($event)"`;
    }

    const containsOnlyConstants = attributeValues.every(
      (attributeValue) => attributeValue.type === "MetaAttributeConstant"
    );

    let response = "";

    response += " ";
    if (!containsOnlyConstants) {
      response += "[";
    }
    response += attributeName;
    if (!containsOnlyConstants) {
      response += "]";
    }
    response += `="`;

    attributeValues.forEach((attributeValue) => {
      if (attributeValue.type !== "MetaAttributeConstant") {
        response += "{{ ";
      }
      const [propExpression] = this.renderAttributeValue(attributeValue);

      response += propExpression;
      if (attributeValue.type !== "MetaAttributeConstant") {
        response += " || '' }}";
      }
    });

    response += '"';

    return response;
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

  onVariable(variable: Parameters<TemplateFormat["onVariable"]>[0]) {
    this.template += `{{${variable.id}}}`;
    if (variable.children.length > 0) {
      this.template += `<ng-template *ngIf="${variable.id} == undefined">`;
    }
  }

  onCloseVariable(variable: Parameters<TemplateFormat["onCloseVariable"]>[0]) {
    if (variable.children.length > 0) {
      this.template += "</ng-template>";
    }
  }

  onIf(onIf: Parameters<TemplateFormat["onIf"]>[0]) {
    if (onIf.parseError === false) {
      this.template += `<span *ngIf="${JSON.stringify(
        onIf.testAsJavaScriptExpression
      )}">`;
    } else {
      this.template += `<!-- parse error: ${onIf.error} -->`;
    }
  }

  onCloseIf(onCloseIf: Parameters<TemplateFormat["onCloseIf"]>[0]) {
    this.template += `</span>`;
  }

  onFinalise(onFinalise: Parameters<TemplateFormat["onFinalise"]>[0]) {
    const componentVarName = startCase(this.templateId).replace(/\s/gi, "");

    this.finalData = `/* DEV NOTE: this template is under development */\n${this.imports}\n\n${this.typeScript}\n\n@Component({\n  selector: '${this.templateId}',\n  template: \`${this.template}\n\`\n})\nexport default class ${componentVarName} {}`;

    try {
      this.finalData = prettier.format(this.finalData, {
        parser: "typescript",
        printWidth: 80,
        plugins: [parserTypeScript],
      });
    } catch (e) {
      // pass
    }
  }

  serialize(): TemplateFiles {
    return {
      [`${this.dirname}/${this.templateId}.ts`]: this.finalData,
    };
  }
}

function isFunctionReference(str: string): boolean {
  return str.startsWith("on") && str.length >= 3;
}
