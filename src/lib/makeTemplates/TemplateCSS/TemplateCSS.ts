import { Template, TemplateFormat, OnConstructor } from "../TemplateFormat";
import { TemplateFiles } from "../../types";

export class TemplateCSS extends Template {
  constructor(args: OnConstructor) {
    super({ componentId: args.componentId, dirname: "css" });
  }

  onElement = (
    onElement: Parameters<TemplateFormat["onElement"]>[0]
  ): ReturnType<TemplateFormat["onElement"]>[0] => {
    return onElement.nodeName;
  };

  onCloseElement = (
    args: Parameters<TemplateFormat["onCloseElement"]>[0]
  ): void => {
    // pass
  };

  onText = (onText: Parameters<TemplateFormat["onText"]>[0]): void => {
    // pass
  };

  onComment = (onComment: Parameters<TemplateFormat["onComment"]>[0]): void => {
    // pass
  };

  serialize = (
    onSerialize: Parameters<TemplateFormat["serialize"]>[0]
  ): TemplateFiles => {
    const { css } = onSerialize;

    return {
      [`${this.dirname}/${this.componentId}.css`]: css,
    };
  };
}
