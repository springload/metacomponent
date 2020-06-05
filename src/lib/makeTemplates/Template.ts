import {
  MetaHTMLElement,
  MetaHTMLText,
  MetaHTMLComment,
  MetaHTMLIf,
  MetaHTMLVariable,
} from "../metaComponent/metaComponent";
import { TemplateFiles } from "../types";
import { Props } from "../metaComponent/getProps";

export interface TemplateFormat {
  dirname: string;
  templateId: string;

  onElement: (element: MetaHTMLElement) => string;
  onText: (text: MetaHTMLText) => void;
  onComment: (text: MetaHTMLComment) => void;
  onCloseElement: (closeElement: OnCloseElement) => void;
  onVariable: (onVariable: MetaHTMLVariable) => void;
  onCloseVariable: (closeVariable: MetaHTMLVariable) => void;
  onIf: (onIf: MetaHTMLIf) => void;
  onCloseIf: () => void;
  serialize: (args: OnSerialize) => TemplateFiles;
}

export type OnConstructor = {
  templateId: string;
  dirname?: string;
  props: Props;
  hasMultipleRootNodes: boolean;
};

type OnCloseElement = {
  openingElement: string;
};

type OnSerialize = {
  css: string;
};

export class Template {
  dirname: string;
  templateId: string;
  props: Props;
  hasMultipleRootNodes: boolean;

  constructor(args: OnConstructor) {
    const { templateId, dirname, props, hasMultipleRootNodes } = args;
    this.dirname = dirname || "";
    this.templateId = templateId;
    this.props = props;
    this.hasMultipleRootNodes = hasMultipleRootNodes;
  }

  onElement(
    onElement: Parameters<TemplateFormat["onElement"]>[0]
  ): ReturnType<TemplateFormat["onElement"]>[0] {
    throw Error("Not implemented");
  }

  onCloseElement(args: Parameters<TemplateFormat["onCloseElement"]>[0]): void {
    throw Error("Not implemented");
  }

  onText(onText: Parameters<TemplateFormat["onText"]>[0]): void {
    throw Error("Not implemented");
  }

  onComment(onComment: Parameters<TemplateFormat["onComment"]>[0]): void {
    throw Error("Not implemented");
  }

  onVariable(onVariable: Parameters<TemplateFormat["onVariable"]>[0]): void {
    throw Error("Not implemented");
  }

  onCloseVariable(
    onCloseVariable: Parameters<TemplateFormat["onCloseVariable"]>[0]
  ): void {
    throw Error("Not implemented");
  }

  onIf(onIf: Parameters<TemplateFormat["onIf"]>[0]): void {
    throw Error("Not implemented");
  }

  onCloseIf(): void {
    throw Error("Not implemented");
  }

  onFinalise(): void {
    throw Error("Not implemented");
  }

  serialize(
    onSerialize: Parameters<TemplateFormat["serialize"]>[0]
  ): TemplateFiles {
    throw Error("Not implemented");
  }
}
