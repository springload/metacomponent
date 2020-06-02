import capitalize from "lodash/capitalize";

const transform: Record<string, string> = {
  class: "className",
  for: "htmlFor",
  autocomplete: "autoComplete",
  "fill-rule": "fillRule",
  readonly: "readOnly",
  autofocus: "autoFocus",
  srcset: "srcSet",
  crossorigin: "crossOrigin",
  spellcheck: "spellCheck",
  tabindex: "tabIndex",
  maxlength: "maxLength",
  // TODO: expand this list... presumably there's an NPM package with these mappings?
};

export function attributeNameTransform(attributeName: string): string {
  // React uses JavaScript names not HTML names which can be different
  // such as className="" vs class="" and htmlFor="" vs for="" and so on
  // so we need to convert them...
  return transform[attributeName] ? transform[attributeName] : attributeName;
}

export function getTypeScriptElementName(tagName: string): string {
  switch (tagName) {
    case "p":
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6":
      return "";
    case "a": {
      return "Anchor";
    }
    case "img": {
      return "Image";
    }
    case "textarea": {
      return "TextArea";
    }
    default: {
      return capitalize(tagName);
    }
  }
}
