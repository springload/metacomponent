import uniq from "lodash/uniq";
import { ReactTemplate } from "../React/React";
import { TemplateFormat, OnConstructor } from "../Template";
import { MetaCSSPropertiesNode } from "../../metaComponent/metaComponent";
import { validJavaScriptIdentifer } from "../utils";

export class ReactStyledComponentsTemplate extends ReactTemplate {
  styledConstants: string[];

  constructor(args: OnConstructor) {
    super({ ...args, dirname: "react-styled-components" });

    this.imports += `import styled from 'styled-components';\n`;

    this.styledConstants = [];
  }

  onElement(
    onElement: Parameters<TemplateFormat["onElement"]>[0]
  ): ReturnType<TemplateFormat["onElement"]>[0] {
    let counter = 1;
    let styledName = onElement.nodeName;
    if (onElement.cssProperties.length) {
      do {
        styledName = `Styled${onElement.nodeName
          .substring(0, 1)
          .toUpperCase()}${onElement.nodeName.substring(1)}${
          counter === 1 ? "" : `_${counter}`
        }`;
        counter++;
      } while (this.styledConstants.includes(styledName));
      this.styledConstants.push(styledName);

      const pickedProps = this.renderCSSPropertyProps(onElement.cssProperties);
      const styledProps = `${styledName}Props`;

      if (pickedProps) {
        this.constants += `type ${styledProps} = ${pickedProps};\n`;
      }
      this.constants += `const ${styledName} = styled.${onElement.nodeName}${
        pickedProps ? `<${styledProps}>` : ""
      }\`\n  ${onElement.cssProperties
        .map((cssProperty) => this.renderCSSProperty(cssProperty, styledProps))
        .join("\n  ")}\n\`;\n\n`;
    }
    const styledAttributes = {
      ...onElement.attributes,
    };
    delete styledAttributes["class"];
    onElement.cssProperties.forEach((cssProperty) => {
      if (cssProperty.type === "MetaCSSPropertiesConstantNode") return;
      styledAttributes[cssProperty.id] = [
        {
          type: "MetaAttributeVariable",
          id: cssProperty.id,
        },
      ];
    });

    super.onElement({
      ...onElement,
      nodeName: styledName,
      attributes: styledAttributes,
    });

    return styledName;
  }

  renderCSSProperty(
    cssPropertiesNode: MetaCSSPropertiesNode,
    styledProps: string
  ): string {
    switch (cssPropertiesNode.type) {
      case "MetaCSSPropertiesConstantNode": {
        return cssPropertiesNode.cssPropertiesString;
      }
      case "MetaCSSPropertiesConditionalNode": {
        const isValidIdentifier = validJavaScriptIdentifer.test(
          cssPropertiesNode.id
        );
        let conditional = "${";
        const identifier = isValidIdentifier
          ? cssPropertiesNode.id
          : `props["${cssPropertiesNode.id}"]`;

        if (isValidIdentifier) {
          conditional += `({${cssPropertiesNode.id}}: ${styledProps}) => (`;
        } else {
          conditional += `(props: ${styledProps}) => (`;
        }

        conditional += JSON.stringify(cssPropertiesNode.condition);
        conditional += `[`;
        conditional += identifier;
        conditional += `])}`;

        return conditional;
      }
    }
  }

  renderCSSPropertyProps(
    cssProperties: MetaCSSPropertiesNode[]
  ): string | undefined {
    const propUnion = uniq(
      cssProperties
        .map((cssProperty): string => {
          if (cssProperty.type === "MetaCSSPropertiesConditionalNode") {
            return `"${cssProperty.id}"`;
          }
          return "";
        })
        .filter((val: string): boolean => !!val)
    ).join(" | ");

    if (propUnion.length === 0) return undefined;
    return `Pick<Props, ${propUnion}>`;
  }
}
