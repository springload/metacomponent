import prettier from "prettier/standalone";
import parserTypeScript from "prettier/parser-typescript";
import { Template, TemplateFormat, OnConstructor } from "../Template";
import { TemplateFiles } from "../../types";
import { attributeNameTransform, getTypeScriptElementName } from "./React.util";
import {
  MetaAttributeValues,
  MetaAttributeValue,
} from "../../metaComponent/parseMetaHTMLAttribute";
import { validJavaScriptIdentifer } from "../utils";

export class ReactTemplate extends Template {
  imports: string;
  render: string;
  typeScript: string;
  constants: string;
  fileData: string;

  constructor(args: OnConstructor) {
    super({ ...args, dirname: args.dirname || "react" });

    this.imports = "";
    this.render = "";
    this.typeScript = "";
    this.fileData = "";
    this.constants = "";

    this.setTypeScript = this.setTypeScript.bind(this);
    this.renderPropType = this.renderPropType.bind(this);

    this.setImports();
    this.setTypeScript();
    this.renderRenderFunction();
  }

  setImports() {
    this.imports += `import React from 'react';\n`;
  }

  setTypeScript() {
    const props = Object.keys(this.props).map(this.renderPropType).join("\n  ");
    this.typeScript = `type Props = {\n  ${props}\n};`;
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
        propString += "React.ReactNode;";
        break;
      }
      case "PropTypeAttributeValue": {
        propString += `React.${getTypeScriptElementName(
          prop.nodeName
        )}HTMLAttributes<HTML${getTypeScriptElementName(
          prop.nodeName
        )}Element>["${attributeNameTransform(prop.attributeName)}"];`;
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
      this.render += `export default function ${this.templateId}(props: Props){\n`;
      const destructure = propIds
        .filter((key) => validJavaScriptIdentifer.test(key))
        .join(", ");
      if (destructure) {
        this.render += `  const { ${destructure} } = props;\n`;
      }
    } else {
      this.render += `export default function ${
        this.templateId
      }({ ${propIds.join(", ")} }: Props){\n`;
    }
    this.render += `  return (\n`;
    if (this.hasMultipleRootNodes) {
      this.render += `<React.Fragment>`;
    }
  }

  onElement(
    onElement: Parameters<TemplateFormat["onElement"]>[0]
  ): ReturnType<TemplateFormat["onElement"]>[0] {
    const { nodeName, attributes } = onElement;
    this.render += `<${nodeName}`;
    Object.keys(attributes).forEach((attributeName) => {
      this.renderAttribute(attributeName, attributes[attributeName]);
    });
    if (onElement.children.length === 0) {
      this.render += "/";
    }
    this.render += ">";
    return nodeName;
  }

  renderAttribute(
    attributeName: string,
    attributeValues: MetaAttributeValues
  ): void {
    // TODO: escape attribute values and keys
    const reactAttributeName = attributeNameTransform(attributeName);
    this.render += ` ${reactAttributeName}=`;
    const containsExpression = attributeValues.some(
      (attributeValue) => attributeValue.type !== "MetaAttributeConstant"
    );
    const containsConstant = attributeValues.some(
      (attributeValue) => attributeValue.type === "MetaAttributeConstant"
    );

    if (containsExpression) {
      this.render += "{";
    } else {
      this.render += '"';
    }

    if (containsExpression && containsConstant) {
      this.render += "`";
    }

    attributeValues.forEach((attributeValue) => {
      if (containsConstant && attributeValue.type !== "MetaAttributeConstant") {
        this.render += "${";
      }
      this.renderAttributeValue(attributeValue);
      if (containsConstant && attributeValue.type !== "MetaAttributeConstant") {
        this.render += " || ''}";
      }
    });

    if (containsExpression && containsConstant) {
      this.render += "`";
    }

    if (containsExpression) {
      this.render += "}";
    } else {
      this.render += '"';
    }
  }

  renderAttributeValue(attributeValue: MetaAttributeValue) {
    switch (attributeValue.type) {
      case "MetaAttributeConstant": {
        this.render += attributeValue.value;
        break;
      }
      case "MetaAttributeVariable": {
        this.render += validJavaScriptIdentifer.test(attributeValue.id)
          ? attributeValue.id
          : `props["${attributeValue.id}"]`;
        break;
      }
      case "MetaAttributeVariableOptions": {
        const identifier = validJavaScriptIdentifer.test(attributeValue.id)
          ? attributeValue.id
          : `props["${attributeValue.id}"]`;

        if (!this.props[attributeValue.id].required) {
          this.render += `${identifier} && `;
        }
        this.render += JSON.stringify(attributeValue.options);
        this.render += `[${identifier}]`;
      }
    }
  }

  onCloseElement(
    onCloseElement: Parameters<TemplateFormat["onCloseElement"]>[0]
  ): void {
    const { openingElement } = onCloseElement;
    this.render += `\n</${openingElement}>\n`;
  }

  onText(onText: Parameters<TemplateFormat["onText"]>[0]): void {
    const { value } = onText;
    this.render += value;
  }

  onComment(onComment: Parameters<TemplateFormat["onComment"]>[0]): void {
    const { value } = onComment;
    this.render += `{/*${value}*/}`;
  }

  onVariable(variable: Parameters<TemplateFormat["onVariable"]>[0]) {
    const identifier = validJavaScriptIdentifer.test(variable.id)
      ? variable.id
      : `props["${variable.id}"]`;
    this.render += `{${identifier} !== undefined ? ${identifier} : `;
    if (variable.children.length === 0) {
      this.render += `null`;
    } else if (variable.children.length === 1) {
      if (variable.children[0].type === "Text") {
        this.render += `\``;
      } else {
        this.render += `(<React.Fragment>`;
      }
    } else {
      this.render += `(<React.Fragment>`;
    }
  }

  onCloseVariable(variable: Parameters<TemplateFormat["onCloseVariable"]>[0]) {
    if (
      variable.children.length === 1 &&
      variable.children[0].type === "Text"
    ) {
      this.render += `\``;
    } else if (variable.children.length > 0) {
      this.render += `</React.Fragment>)`;
    }
    this.render += `}`;
  }

  onIf(onIf: Parameters<TemplateFormat["onIf"]>[0]) {
    if (onIf.parseError === false) {
      this.render += `{${onIf.testAsJavaScriptExpression} && (<React.Fragment>`;
    } else {
      this.render += `{false && (<React.Fragment>`;
    }
  }

  onCloseIf(onCloseIf: Parameters<TemplateFormat["onCloseIf"]>[0]) {
    this.render += `</React.Fragment>)}`;
  }

  onFinalise() {
    if (this.hasMultipleRootNodes) {
      this.render += `</React.Fragment>`;
    }

    this.fileData = `${this.imports}\n${this.typeScript}\n\n${this.constants}\n\n${this.render}\n  )\n};\n`;

    try {
      this.fileData = prettier.format(this.fileData, {
        parser: "typescript",
        printWidth: 80,
        plugins: [parserTypeScript],
      });
    } catch (e) {
      // pass
    }
  }

  serialize(
    onSerialize: Parameters<TemplateFormat["serialize"]>[0]
  ): TemplateFiles {
    return {
      [`${this.dirname}/${this.templateId}.tsx`]: this.fileData,
    };
  }
}
