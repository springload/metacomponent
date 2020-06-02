import prettier from "prettier/standalone";
import parserTypeScript from "prettier/parser-typescript";
import { Template, TemplateFormat, OnConstructor } from "../Template";
import { TemplateFiles } from "../../types";
import { attributeNameTransform, getTypeScriptElementName } from "./React.util";
import {
  MetaAttributeValues,
  MetaAttributeValue,
} from "../../metaTemplate/parseMetaHTMLAttribute";
import { validJavaScriptIdentifer } from "../utils";

export class ReactTemplate extends Template {
  render: string;
  typeScript: string;
  fileData: string;

  constructor(args: OnConstructor) {
    super({ ...args, dirname: "react" });

    this.render = "";
    this.typeScript = "";
    this.fileData = "";
    this.renderTypeScript();
    this.renderRenderFunction();
  }

  renderTypeScript = () => {
    const props = Object.keys(this.props).map(this.getPropType).join("\n  ");
    this.typeScript = `type Props = {\n  ${props}\n};`;
  };

  getPropType = (propId: string): string => {
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
  };

  renderRenderFunction = () => {
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
  };

  onElement = (
    onElement: Parameters<TemplateFormat["onElement"]>[0]
  ): ReturnType<TemplateFormat["onElement"]>[0] => {
    const { nodeName, attributes } = onElement;
    this.render += `<${nodeName}`;
    Object.keys(attributes).forEach((attributeName) => {
      this.renderAttribute(attributeName, attributes[attributeName]);
    });
    this.render += ">";
    return nodeName;
  };

  renderAttribute = (
    attributeName: string,
    attributeValues: MetaAttributeValues
  ): void => {
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
  };

  renderAttributeValue = (attributeValue: MetaAttributeValue) => {
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
        this.render += `({${Object.keys(attributeValue.options).map(
          (optionKey) => `"${optionKey}":"${attributeValue.options[optionKey]}"`
        )}})[${identifier}]`;
      }
    }
  };

  onCloseElement = (
    onCloseElement: Parameters<TemplateFormat["onCloseElement"]>[0]
  ): void => {
    const { openingElement } = onCloseElement;
    this.render += `\n</${openingElement}>\n`;
  };

  onText = (onText: Parameters<TemplateFormat["onText"]>[0]): void => {
    const { value } = onText;
    this.render += value;
  };

  onComment = (onComment: Parameters<TemplateFormat["onComment"]>[0]): void => {
    const { value } = onComment;
    this.render += `<!--${value}-->`;
  };

  onVariable = (variable: Parameters<TemplateFormat["onVariable"]>[0]) => {
    this.render += `{${
      validJavaScriptIdentifer.test(variable.id)
        ? variable.id
        : `props["${variable.id}"]`
    }}`;
  };

  onIf = (onIf: Parameters<TemplateFormat["onIf"]>[0]) => {
    if (onIf.parseError === false) {
      this.render += `{${onIf.testAsJavaScriptExpression} && (<React.Fragment>`;
    } else {
      this.render += `{false && (<React.Fragment>`;
    }
  };

  onCloseIf = () => {
    this.render += `</React.Fragment>)}`;
  };

  onFinalise = () => {
    if (this.hasMultipleRootNodes) {
      this.render += `</React.Fragment>`;
    }

    this.fileData = `import React from 'react';\n\n${this.typeScript}\n\n${this.render}\n  )\n};\n`;

    try {
      this.fileData = prettier.format(this.fileData, {
        parser: "typescript",
        printWidth: 80,
        plugins: [parserTypeScript],
      });
    } catch (e) {
      // pass
    }
  };

  serialize = (
    onSerialize: Parameters<TemplateFormat["serialize"]>[0]
  ): TemplateFiles => {
    return {
      [`${this.dirname}/${this.templateId}.tsx`]: this.fileData,
    };
  };
}
