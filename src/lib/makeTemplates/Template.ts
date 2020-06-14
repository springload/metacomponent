import {
  MetaHTMLElement,
  MetaHTMLText,
  MetaHTMLComment,
  MetaHTMLIf,
  MetaHTMLVariable,
  MetaNode,
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
  onVariable: (onVariable: MetaHTMLVariable) => OnVariableResponse;
  onCloseVariable: (closeVariable: MetaHTMLVariable) => void;
  onIf: (onIf: MetaHTMLIf) => void;
  onCloseIf: (onCloseIf: MetaHTMLIf) => void;
  onFinalise: (args: OnFinalise) => void;
  serialize: () => TemplateFiles;
}

export type OnConstructor = {
  templateId: string;
  dirname?: string;
  props: Props;
  hasMultipleRootNodes: boolean;
};

type OnCloseElement = {
  children: MetaNode[];
  openingElement: string;
};

type OnFinalise = {
  css: string;
};

type ShouldNotRenderChildren = true;

type OnVariableResponse = ShouldNotRenderChildren | void;

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

  onVariable(
    onVariable: Parameters<TemplateFormat["onVariable"]>[0]
  ): ReturnType<TemplateFormat["onVariable"]> {
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

  onCloseIf(onCloseIf: Parameters<TemplateFormat["onCloseIf"]>[0]): void {
    throw Error("Not implemented");
  }

  onFinalise(onFinalise: Parameters<TemplateFormat["onFinalise"]>[0]): void {
    throw Error("Not implemented");
  }

  serialize(): TemplateFiles {
    throw Error("Not implemented");
  }
}
