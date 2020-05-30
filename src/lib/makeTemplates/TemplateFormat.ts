import {
  MetaHTMLElement,
  MetaHTMLText,
  MetaHTMLComment,
} from "../metaTemplate/metaTemplate";
import { TemplateFiles } from "../types";

export interface TemplateFormat {
  dirname: string;
  templateId: string;

  onElement: (element: MetaHTMLElement) => string;
  onText: (text: MetaHTMLText) => void;
  onComment: (text: MetaHTMLComment) => void;
  onCloseElement: (closeElement: OnCloseElement) => void;
  serialize: (args: OnSerialize) => TemplateFiles;
}

export type OnConstructor = {
  templateId: string;
  dirname?: string;
};

type OnCloseElement = {
  openingElement: string;
};

type OnSerialize = {
  css: string;
};

export class Template implements TemplateFormat {
  dirname: string;
  templateId: string;

  constructor(args: OnConstructor) {
    const { templateId, dirname } = args;
    this.dirname = dirname || "";
    this.templateId = templateId;
  }

  onElement = (
    onElement: Parameters<TemplateFormat["onElement"]>[0]
  ): ReturnType<TemplateFormat["onElement"]>[0] => {
    throw Error("Not implemented");
  };

  onCloseElement = (
    args: Parameters<TemplateFormat["onCloseElement"]>[0]
  ): void => {
    throw Error("Not implemented");
  };

  onText = (onText: Parameters<TemplateFormat["onText"]>[0]): void => {
    throw Error("Not implemented");
  };

  onComment = (onComment: Parameters<TemplateFormat["onComment"]>[0]): void => {
    throw Error("Not implemented");
  };

  serialize = (
    onSerialize: Parameters<TemplateFormat["serialize"]>[0]
  ): TemplateFiles => {
    throw Error("Not implemented");
  };
}
