import { aliasParsingModeElements, parsingModeTags } from "./parseMetaHTML";

test("aliasParsingModeElements", () => {
  const metaHTML =
    parsingModeTags.map((tag) => `<${tag}>`).join("") +
    [...parsingModeTags]
      .reverse()
      .map((tag) => `</${tag}>`)
      .join("");

  const result = aliasParsingModeElements(metaHTML);

  parsingModeTags.forEach((tag) => {
    expect(result).toEqual(expect.not.stringContaining(`<${tag}`));
  });

  parsingModeTags.forEach((tag) => {
    expect(result).toEqual(expect.stringContaining(`"${tag}"`));
  });
});

test("aliasParsingModeElements linebreak bug", () => {
  const metaHTML =
    parsingModeTags.map((tag) => `<${tag}\n>`).join("") +
    [...parsingModeTags]
      .reverse()
      .map((tag) => `</${tag}>`)
      .join("");

  const result = aliasParsingModeElements(metaHTML);

  parsingModeTags.forEach((tag) => {
    expect(result).toEqual(expect.not.stringContaining(`<${tag}`));
  });

  parsingModeTags.forEach((tag) => {
    expect(result).toEqual(expect.stringContaining(`"${tag}"`));
  });
});

test("aliasParsingModeElements whitespace bug", () => {
  const metaHTML =
    parsingModeTags.map((tag) => `<${tag} >`).join("") +
    [...parsingModeTags]
      .reverse()
      .map((tag) => `</${tag}>`)
      .join("");

  const result = aliasParsingModeElements(metaHTML);

  parsingModeTags.forEach((tag) => {
    expect(result).toEqual(expect.not.stringContaining(`<${tag}`));
  });

  parsingModeTags.forEach((tag) => {
    expect(result).toEqual(expect.stringContaining(`"${tag}"`));
  });
});
