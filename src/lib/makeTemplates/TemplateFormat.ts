import {
  MetaHTMLElement,
  MetaHTMLText,
  MetaHTMLComment,
} from "../metaHTML/metaHTML";
import { TemplateFiles } from "../types";

export interface TemplateFormat {
  dirname: string;
  componentId: string;

  onElement: (element: MetaHTMLElement) => string;
  onText: (text: MetaHTMLText) => void;
  onComment: (text: MetaHTMLComment) => void;
  onCloseElement: (closeElement: OnCloseElement) => void;
  serialize: (args: OnSerialize) => TemplateFiles;
}

export type OnConstructor = {
  componentId: string;
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
  componentId: string;

  constructor(args: OnConstructor) {
    const { componentId, dirname } = args;
    this.dirname = dirname || "";
    this.componentId = componentId;
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

  onComment = (onText: Parameters<TemplateFormat["onComment"]>[0]): void => {
    throw Error("Not implemented");
  };

  serialize = (
    onSerialize: Parameters<TemplateFormat["serialize"]>[0]
  ): TemplateFiles => {
    throw Error("Not implemented");
  };
}
