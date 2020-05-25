import prettier from "prettier";
import { Template, TemplateFormat, OnConstructor } from "../TemplateFormat";
import { TemplateFiles } from "../../types";

export class TemplateCSS extends Template {
  constructor(args: OnConstructor) {
    super({ templateId: args.templateId, dirname: "css" });
  }

  onElement = (
    onElement: Parameters<TemplateFormat["onElement"]>[0]
  ): ReturnType<TemplateFormat["onElement"]>[0] => {
    return onElement.nodeName;
  };

  onCloseElement = (
    args: Parameters<TemplateFormat["onCloseElement"]>[0]
  ): void => {};

  onText = (onText: Parameters<TemplateFormat["onText"]>[0]): void => {};

  serialize = (
    onSerialize: Parameters<TemplateFormat["serialize"]>[0]
  ): TemplateFiles => {
    const { css } = onSerialize;

    const formattedCSS = prettier.format(css, {
      parser: "scss", // use scss regardless of whether we're doing scss or css because css is a subset of scss (afaik)
    });

    return {
      [`${this.dirname}/${this.templateId}.css`]: formattedCSS,
    };
  };
}
