import prettier from "prettier/standalone";
import parserPostCSS from "prettier/parser-postcss";
import { Template, TemplateFormat, OnConstructor } from "../Template";
import { TemplateFiles } from "../../types";

export class CSSTemplate extends Template {
  constructor(args: OnConstructor) {
    super({ ...args, dirname: "css" });
  }

  onElement(
    onElement: Parameters<TemplateFormat["onElement"]>[0]
  ): ReturnType<TemplateFormat["onElement"]>[0] {
    return onElement.nodeName;
  }

  onCloseElement(args: Parameters<TemplateFormat["onCloseElement"]>[0]): void {
    // pass
  }

  onText(onText: Parameters<TemplateFormat["onText"]>[0]): void {
    // pass
  }

  onComment(onComment: Parameters<TemplateFormat["onComment"]>[0]): void {
    // pass
  }

  onVariable(variable: Parameters<TemplateFormat["onVariable"]>[0]) {
    // pass
  }

  onCloseVariable(closeVariable: Parameters<TemplateFormat["onVariable"]>[0]) {
    // pass
  }

  onIf(onIf: Parameters<TemplateFormat["onIf"]>[0]) {
    // pass
  }

  onCloseIf() {
    // pass
  }

  onFinalise() {
    // pass
  }

  serialize(
    onSerialize: Parameters<TemplateFormat["serialize"]>[0]
  ): TemplateFiles {
    const { css } = onSerialize;

    let newCSS = css;
    try {
      newCSS = prettier.format(newCSS, {
        parser: "scss",
        printWidth: 80,
        plugins: [parserPostCSS],
      });
    } catch (e) {
      // pass
    }

    return {
      [`${this.dirname}/${this.templateId}.css`]: newCSS,
    };
  }
}
