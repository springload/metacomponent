import { Log } from "../log";

export const parseAttributeValue = (
  metaHTMLAttributeValueString: string,
  log: Log
): MetaAttributeValuesInternal => {
  const response: MetaAttributeValuesInternal = [];
  let remaining: string = metaHTMLAttributeValueString;
  const start = "{{" as const;
  const end = "}}" as const;

  while (remaining.length) {
    const startIndex = remaining.indexOf(start);

    if (startIndex === -1) {
      // no MetaAttributeVariable, just string remainings
      response.push({
        type: "MetaAttributeConstant",
        value: remaining,
      });
      remaining = "";
    } else if (startIndex === 0) {
      // a MetaAttributeVariable
      const endIndex = remaining.indexOf(end, startIndex);
      if (endIndex === -1) {
        log(`Attribute with ${start} but no ${end}.`);
        return response;
      }
      const dkString = remaining.substring(start.length, endIndex);
      const metaVariable = parseMetaAttributeVariable(dkString);
      response.push(metaVariable);
      remaining = remaining.substring(endIndex + end.length);
    } else {
      // string before another MetaVariable
      response.push({
        type: "MetaAttributeConstant",
        value: remaining.substring(0, startIndex),
      });
      remaining = remaining.substring(startIndex);
    }
  }
  return response;
};

export const parseMetaAttributeVariable = (
  dk: string
): MetaAttributeVariableInternal | MetaAttributeVariableOptionsInternal => {
  const SEPARATOR = ":";
  const ENUM_SEPARATOR = "|";
  const OPTIONAL = "?";

  const escapeTextForRegex = (text: string) => {
    return text.replace(/([()[{*+.$^\\|?])/g, "\\$1");
  };

  const optionalRegexp = new RegExp(`${escapeTextForRegex(OPTIONAL)}$`); // regex anchored to end of string

  const separatorIndex = dk.indexOf(SEPARATOR);
  let keySegment = separatorIndex === -1 ? dk : dk.substring(0, separatorIndex);
  keySegment = keySegment.trim();
  const isOptional = keySegment.endsWith(OPTIONAL);
  if (isOptional) {
    keySegment = keySegment.replace(optionalRegexp, "");
  }

  if (separatorIndex === -1) {
    // chance to exit early
    return {
      type: "MetaAttributeVariable",
      id: keySegment,
      required: !isOptional,
    };
  }

  const options: Record<string, string> = dk
    .substring(separatorIndex + SEPARATOR.length)
    .split(ENUM_SEPARATOR)
    .reduce((options: Record<string, string>, option: string): Record<
      string,
      string
    > => {
      // An option is a string that looks like either,
      //    " valueThatIsAlsoName "
      //    " value as friendlyName "
      // so when split by " as " it will have either
      // 1 or 2 array items.
      const parts: string[] = option.split(" as ");
      const name = parts.length === 2 ? parts[1].trim() : parts[0].trim();
      if (name.length > 0) {
        options[name] = parts[0].trim();
      }
      return options;
    }, {});

  return {
    type: "MetaAttributeVariableOptions",
    id: keySegment,
    required: !isOptional,
    options,
  };
};

export type MetaAttributeVariable = {
  type: "MetaAttributeVariable";
  id: string;
};

export type MetaAttributeVariableOptions = {
  type: "MetaAttributeVariableOptions";
  id: string;
  options: Record<string, string>;
};

export type MetaAttributeConstant = {
  type: "MetaAttributeConstant";
  value: string;
};

type MetaAttributeVariableInternal = MetaAttributeVariable & {
  required: boolean;
};
type MetaAttributeVariableOptionsInternal = MetaAttributeVariableOptions & {
  required: boolean;
};

export type MetaAttributeValueInternal =
  | MetaAttributeConstant
  | MetaAttributeVariableInternal
  | MetaAttributeVariableOptionsInternal;

export type MetaAttributeValuesInternal = MetaAttributeValueInternal[];

export type MetaAttributeValue =
  | MetaAttributeConstant
  | MetaAttributeVariable
  | MetaAttributeVariableOptions;

export type MetaAttributeValues = MetaAttributeValue[];
