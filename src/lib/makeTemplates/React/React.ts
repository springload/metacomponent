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
  renderPrefix: string;
  render: string;
  renderSuffix: string;
  typeScript: string;
  constants: string;
  fileData: string;
  fragmentStrings: Required<ReactExtensions>["fragmentStrings"];
  reactNameReplacement: Required<ReactExtensions>["reactNameReplacement"];

  constructor(args: OnConstructor & ReactExtensions) {
    super({ ...args, dirname: args.dirname || "react" });
    this.imports = "";
    this.renderPrefix = "";
    this.render = "";
    this.renderSuffix = "";
    this.typeScript = "";
    this.fileData = "";
    this.constants = "";
    this.fragmentStrings = args.fragmentStrings || {
      start: "<React.Fragment>",
      end: "</React.Fragment>",
    };
    this.reactNameReplacement =
      args.reactNameReplacement !== undefined
        ? args.reactNameReplacement
        : attributeNameTransform;

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
        if (prop.attributeName.startsWith("data-")) {
          propString += "string";
        } else {
          propString += `React.${getTypeScriptElementName(
            prop.nodeName
          )}HTMLAttributes<HTML${getTypeScriptElementName(
            prop.nodeName
          )}Element>["${attributeNameTransform(prop.attributeName)}"];`;
        }
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
    // ensure a named export (not just a default export)
    this.renderPrefix = `export function `;
    if (containsInvalidIdentifiers) {
      this.renderPrefix += `${this.templateId}(props: Props){\n`;
      const destructure = propIds
        .filter((key) => validJavaScriptIdentifer.test(key))
        .join(", ");
      if (destructure) {
        this.renderPrefix += `  const { ${destructure} } = props;\n`;
      }
    } else {
      this.renderPrefix += `${this.templateId}({ ${propIds.join(
        ", "
      )} }: Props){\n`;
    }
    this.renderPrefix += `  return (\n`;
    if (this.hasMultipleRootNodes) {
      this.renderPrefix += this.fragmentStrings.start;
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
    const reactAttributeName = this.reactNameReplacement(attributeName);
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

    const isTemplateString = containsExpression && containsConstant;

    if (isTemplateString) {
      this.render += "`";
    }

    attributeValues.forEach((attributeValue) => {
      if (containsConstant && attributeValue.type !== "MetaAttributeConstant") {
        this.render += "${";
      }
      this.renderAttributeValue(attributeValue, isTemplateString);
      if (containsConstant && attributeValue.type !== "MetaAttributeConstant") {
        this.render += "}";
      }
    });

    if (isTemplateString) {
      this.render += "`";
    }

    if (containsExpression) {
      this.render += "}";
    } else {
      this.render += '"';
    }
  }

  renderAttributeValue(attributeValue: MetaAttributeValue, inString: boolean) {
    switch (attributeValue.type) {
      case "MetaAttributeConstant": {
        this.render += attributeValue.value.replace(/`/g, "`");
        break;
      }
      case "MetaAttributeVariable": {
        const isOptional = !this.props[attributeValue.id].required;
        const identifier = validJavaScriptIdentifer.test(attributeValue.id)
          ? attributeValue.id
          : `props[${JSON.stringify(attributeValue.id)}]`;
        if (isOptional) {
          this.render += `${identifier}${inString ? ` || ""` : ""}`;
        } else {
          this.render += identifier;
        }
        break;
      }
      case "MetaAttributeVariableOptions": {
        const isOptional = !this.props[attributeValue.id].required;
        const identifier = validJavaScriptIdentifer.test(attributeValue.id)
          ? attributeValue.id
          : `props[${JSON.stringify(attributeValue.id)}]`;

        if (isOptional) {
          this.render += `${identifier} ? `;
        }

        this.render += JSON.stringify(attributeValue.options);
        this.render += `[${identifier}]`;

        if (isOptional) {
          this.render += `: ${inString ? "''" : "undefined"}`;
        }
      }
    }
  }

  onCloseElement(
    onCloseElement: Parameters<TemplateFormat["onCloseElement"]>[0]
  ): void {
    const { openingElement, children } = onCloseElement;
    if (children.length > 0) {
      // because it was already rendered as a self-closing if it had no children
      this.render += `\n</${openingElement}>\n`;
    }
  }

  onText(onText: Parameters<TemplateFormat["onText"]>[0]): void {
    const { value } = onText;
    this.render += value;
  }

  onComment(onComment: Parameters<TemplateFormat["onComment"]>[0]): void {
    const { value } = onComment;
    this.render += `{/*${value}*/}`;
  }

  onVariable(
    variable: Parameters<TemplateFormat["onVariable"]>[0]
  ): ReturnType<TemplateFormat["onVariable"]> {
    const prop = this.props[variable.id];

    const identifier = validJavaScriptIdentifer.test(variable.id)
      ? variable.id
      : `props[${JSON.stringify(variable.id)}]`;

    if (prop) {
      if (prop.required) {
        this.render += `{${identifier}}`;
        return true;
      } else {
        this.render += `{${identifier} !== undefined ? ${identifier} : `;
        if (variable.children.length === 0) {
          this.render += `null`;
        } else if (
          variable.children.length === 1 &&
          variable.children[0].type === "Text"
        ) {
          this.render += `\`${variable.children[0].value.replace(/`/g, "\\`")}`;
          return true;
        } else {
          this.render += `(${this.fragmentStrings.start}`;
        }
      }
    }
  }

  onCloseVariable(variable: Parameters<TemplateFormat["onCloseVariable"]>[0]) {
    const prop = this.props[variable.id];

    if (prop && prop.required) {
      // If this is genuinely required then there's no need to render anything
      return;
    }

    if (
      prop &&
      variable.children.length === 1 &&
      variable.children[0].type === "Text"
    ) {
      this.render += `\``;
    } else if (variable.children.length > 0) {
      this.render += `${this.fragmentStrings.end})`;
    }
    this.render += `}`;
  }

  onIf(onIf: Parameters<TemplateFormat["onIf"]>[0]) {
    if (onIf.parseError === false) {
      this.render += `{${onIf.testAsJavaScriptExpression} && (${this.fragmentStrings.start}`;
    } else {
      this.render += `{false && (${this.fragmentStrings.start}`;
    }
  }

  onCloseIf(onCloseIf: Parameters<TemplateFormat["onCloseIf"]>[0]) {
    this.render += `${this.fragmentStrings.end})}`;
  }

  onFinalise(
    onSerialize: Parameters<TemplateFormat["onFinalise"]>[0]
  ): TemplateFiles | undefined {
    if (this.hasMultipleRootNodes) {
      this.renderSuffix = this.fragmentStrings.end;
    }

    const renderFunction = `${this.renderPrefix}${this.render}${this.renderSuffix})\n}; export default ${this.templateId}`;

    this.fileData = `${this.imports}\n${this.typeScript}\n\n${this.constants}\n\n${renderFunction}\n`;

    try {
      this.fileData = prettier.format(this.fileData, {
        parser: "typescript",
        printWidth: 80,
        plugins: [parserTypeScript],
      });
    } catch (e) {
      // pass
    }

    return {
      renderFunction,
      render: this.render,
      typeScript: this.typeScript,
      constants: this.constants,
    };
  }

  serialize(): TemplateFiles {
    return {
      [`${this.dirname}/${this.templateId}.tsx`]: this.fileData,
    };
  }
}

export type FragmentStrings = {
  start: string;
  end: string;
};

export type ReactExtensions = {
  fragmentStrings?: FragmentStrings;
  reactNameReplacement?: (name: string) => string;
};
