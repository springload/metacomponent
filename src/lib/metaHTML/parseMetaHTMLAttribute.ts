export const parseAttributeValue = (
  metaHTMLAttributeValueString: string
): MetaAttributeValue => {
  const response: MetaAttributeValue = [];
  let remaining: string = metaHTMLAttributeValueString;
  const start = "{{" as const;
  const end = "}}" as const;

  console.log("going in...");

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
        throw Error(`Attribute with ${start} but no ${end}.`);
      }
      const dkString = remaining.substring(start.length, endIndex);
      const metaVariable = parseMetaVariable(dkString);
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

    console.log(remaining.length);
  }
  return response;
};

export const parseMetaVariable = (
  dk: string
): MetaAttributeVariable | MetaAttributeVariableOptions => {
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
      options[name] = parts[0].trim();
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
  required: boolean;
};

export type MetaAttributeVariableOptions = {
  type: "MetaAttributeVariableOptions";
  id: string;
  required: boolean;
  options: Record<string, string>;
};

export type MetaAttributeConstant = {
  type: "MetaAttributeConstant";
  value: string;
};

export type MetaAttributeValue = (
  | MetaAttributeConstant
  | MetaAttributeVariable
  | MetaAttributeVariableOptions
)[];
