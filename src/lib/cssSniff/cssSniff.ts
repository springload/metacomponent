type Options = {
  ignoreChildren?: boolean;
  whitelist?: { stylesheet?: string; media?: string; rule?: string };
  blacklist?: { stylesheet?: string; media?: string; rule?: string };
};

export type CSSSniffRoot = {
  [sheetIndex: string]: CSSSniffStyleSheet;
};

export type CSSSniffStyleSheet = {
  [ruleIndex: string]: CSSSniffStyleRule | CSSSniffMediaRule;
};

export type CSSSniffStyleRule = {
  type: "CSSSniffStyleRule";
  selectors: string[];
  properties: string;
};

export type CSSSniffMediaRule = {
  type: "CSSSniffMediaRule";
  before: string;
  children: CSSSniffStyleSheet;
};

export function cssSniff(
  children: ChildNode[],
  options: Options,
  matchedCSS?: CSSSniffRoot
): CSSSniffRoot {
  const matched: CSSSniffRoot = matchedCSS || {};

  children.forEach((child) => {
    if (child.nodeType !== child.ELEMENT_NODE) {
      // only Elements can have CSS (ie, text nodes can't have CSS)
      return;
    }
    // @ts-ignore
    const el: HTMLElement = child;
    getCSSMatchesByElement(el, options, matched);
    if (!options.ignoreChildren && el.childNodes) {
      cssSniff(Array.from(el.childNodes), options, matched);
    }
  });

  return matched;
}

function getCSSMatchesByElement(
  el: HTMLElement,
  options: Options,
  sniffRoot: CSSSniffRoot
): void {
  if (el.nodeType !== el.ELEMENT_NODE) {
    return;
  }

  const sheets = el.ownerDocument?.styleSheets;
  if (!sheets) {
    throw Error(`Expected to find stylesheets of Node.`);
  }
  // @ts-ignore
  const sheetsArray: CSSStyleSheet[] = Array.from(sheets);

  for (let i in sheetsArray) {
    const sheet = sheetsArray[i];

    const cssRulesArray = Array.from(sheet.cssRules);

    if (sheetIsAllowed(sheet, options)) {
      const cssSniffStyleSheet: CSSSniffStyleSheet = sniffRoot[i] || {};
      sniffRoot[i] = cssSniffStyleSheet;
      _filterCSSRulesByElement(el, cssRulesArray, options, cssSniffStyleSheet);
    }
  }
}

function _filterCSSRulesByElement(
  el: HTMLElement,
  rules: CSSRule[],
  options: Options,
  cssSniffStyleSheet: CSSSniffStyleSheet // is mutated
): void {
  for (let i in rules) {
    const rule = rules[i];

    // @ts-ignore
    if (rule.selectorText) {
      // @ts-ignore
      const cssStyleRule: CSSStyleRule = rule;
      const sanitisedSelector = cssStyleRule.selectorText.replace(
        /@charset.*?;/g,
        ""
      );

      if (ruleIsAllowed(sanitisedSelector, options)) {
        const selectors = splitSelectors(sanitisedSelector);

        selectors.forEach((selector) => {
          let trimmedSelector;
          let normalizedSelector;

          try {
            // Exceptions may be thrown about browser-specific
            // selectors such as
            //
            //   input::-moz-something
            //   input::-webkit-something
            //   input::-ms-something
            //   input:-moz-something
            //   input:-webkit-something
            //   input:-ms-something
            //
            // or potentially selectors without anything before
            // the ":",
            //
            //   ::-moz-something
            //   :not(input)
            //
            // and there are also escaped selectors like,
            //
            //   .link.\:link
            //
            //  (used like <input class="link :link">)
            //
            // and pseudo-elements like,
            //
            //   span::before
            //
            // where the "::before" is irrelevant to whether the
            // selector matches the element so we should remove it.
            //
            // and
            //
            //   input:first-child
            //   p > :first-child
            //
            // where we should change to
            //   input
            //   p > *
            // respectively because we can't know HTML structure.
            //
            // So given all those scenarios we have the following logic,
            //
            // 1) If it starts with ":" without anything preceding we'll
            //    consider it a match because it could be.
            //    (maybe this should be configurable?)
            //
            // 2) If it has a ":" in it that's not preceded by "\" then
            //    we remove to the end of the selector. ie,
            //    input:-moz-something -> input
            //    input\:-moz-something -> input\:-moz-something
            //    input::before -> input::before
            //    input\:\:moz-something -> input\:\:moz-something

            // PRE-NORMALISATON
            // Temporarily replace "\:" (escaped colon) to simplify
            // removing ":something" (real colon) which we restore later.
            normalizedSelector = selector.replace(/\\:/g, unique).trim();

            // START OF NORMALIZATION
            // The goal here is to anticipate any possible node states that
            // might match this node (ie, "":checked" or adjacent sibling/hierarchical
            // selectors)

            normalizedSelector = normalizedSelector
              .replace(/^.*[\s]/, "") // regex 'greedy' selector anchored to string start, searching for whitespace to convert (eg) ".a + .b + .c" to ".c". Delete any conditions on hierarchical (adjacent sibling / descendent etc.) selectors because they could match and that's close enough to warrant including it.
              .replace(/:+.*$/gi, "") // regex 'greedy' selector anchored to string end, searching for ":" and deleting everything after
              .trim();

            // END OF NORMALISATION

            // Restore escaped colons back to "\:".
            // See above comment about escaped colons.
            normalizedSelector = normalizedSelector.replace(
              new RegExp(unique, "g"),
              "\\:"
            );

            const isMatch = el.matches(normalizedSelector);

            if (isMatch) {
              const existingCSSSniffStyleRule = cssSniffStyleSheet[i];
              if (
                existingCSSSniffStyleRule &&
                existingCSSSniffStyleRule.type !== "CSSSniffStyleRule"
              ) {
                throw Error("Rule can't change type");
              }
              const cssSniffStyleRule: CSSSniffStyleRule = {
                type: "CSSSniffStyleRule",
                selectors: existingCSSSniffStyleRule
                  ? existingCSSSniffStyleRule.selectors
                  : [],
                properties: cssStyleRule.cssText.substring(
                  cssStyleRule.cssText.indexOf("{") + 1,
                  cssStyleRule.cssText.lastIndexOf("}")
                ),
              };
              if (!cssSniffStyleRule.selectors.includes(selector)) {
                cssSniffStyleRule.selectors.push(selector);
              }
              cssSniffStyleSheet[i] = cssSniffStyleRule;
            }
          } catch (e) {
            const isCharsetError =
              "@charset".indexOf(cssStyleRule.selectorText) !== -1;
            if (!isCharsetError) {
              console.error(
                "ERROR",
                cssStyleRule.type,
                `[${trimmedSelector}]`,
                `[[${normalizedSelector}]]`,
                `(((${cssStyleRule.selectorText})))`,
                e
              );
            }
          }
        });
      }
    } else if (
      // @ts-ignore
      rule.media
    ) {
      // @ts-ignore
      const cssMediaRule: CSSMediaRule = rule;
      const conditionText = cssMediaRule.conditionText || cssMediaRule.media[0];
      if (mediaIsAllowed(conditionText, options)) {
        // a nested rule like @media { rule { ... } }
        // so we filter the rules inside individually
        const cssRulesArray = Array.from(cssMediaRule.cssRules);

        const existingMediaRule = cssSniffStyleSheet[i];
        if (
          existingMediaRule &&
          existingMediaRule.type !== "CSSSniffMediaRule"
        ) {
          throw Error(`Can't change type`);
        }

        const childrenRules: CSSSniffStyleSheet = existingMediaRule
          ? existingMediaRule.children
          : {};

        _filterCSSRulesByElement(el, cssRulesArray, options, childrenRules);

        if (Object.keys(childrenRules).length > 0) {
          cssSniffStyleSheet[i] = {
            type: "CSSSniffMediaRule",
            before: "@media " + conditionText,
            children: childrenRules,
          };
        }
      }
    }
  }
}

function sheetIsAllowed(sheet: StyleSheet, options: Options) {
  // Returns boolean of whether the sheet is allowed
  // due to whitelist/blacklist
  if (!sheet) return false;
  if (!sheet.ownerNode) return true;

  const checkStylesheet = (sheet: StyleSheet, sheetMatch: string) => {
    switch (sheet.ownerNode.nodeName.toLowerCase()) {
      case "style":
      case "link":
        // @ts-ignore
        const el: HTMLElement = sheet.ownerNode;
        // matching on JSON.stringify(node.attrs)
        const nodeAttrs = el.attributes;
        const attrs: Record<string, string> = {};
        for (let i = 0; i < nodeAttrs.length; i++) {
          const name = nodeAttrs[i].name;
          attrs[name] = nodeAttrs[i].value;
        }
        const attributesJSON = JSON.stringify(attrs);
        return attributesJSON.indexOf(sheetMatch) !== -1;
    }
    throw new Error(
      `CSS Sniff: Unknown sheet nodeName of ${
        sheet.ownerNode && sheet.ownerNode.nodeName
      } `
    );
  };

  let whitelisted = true;
  let blacklisted = false;

  const whitelistStylesheets =
    options.whitelist && options.whitelist.stylesheet;
  if (whitelistStylesheets) {
    const sheetMatches = Array.isArray(whitelistStylesheets)
      ? Array.from(whitelistStylesheets)
      : [whitelistStylesheets];
    whitelisted = sheetMatches.some((sheetMatch) =>
      checkStylesheet(sheet, sheetMatch)
    );
  }

  const blacklistStylesheets =
    options.blacklist && options.blacklist.stylesheet;
  if (blacklistStylesheets) {
    const sheetMatches = Array.isArray(blacklistStylesheets)
      ? blacklistStylesheets
      : [blacklistStylesheets];
    blacklisted = sheetMatches.some((sheetMatch) =>
      checkStylesheet(sheet, sheetMatch)
    );
  }

  return whitelisted !== false && blacklisted !== true;
}

function mediaIsAllowed(mediaString: string, options: Options) {
  if (!options || !mediaString) return false;

  let whitelisted = true;
  let blacklisted = false;

  const whitelistMedia = options.whitelist && options.whitelist.media;
  if (whitelistMedia) {
    const mediaMatches = Array.isArray(whitelistMedia)
      ? whitelistMedia
      : [whitelistMedia];
    whitelisted = mediaMatches.some(
      (mediaMatch) => mediaString.indexOf(mediaMatch) !== -1
    );
  }

  const blacklistMedia = options.blacklist && options.blacklist.media;
  if (blacklistMedia) {
    const mediaMatches = Array.isArray(blacklistMedia)
      ? blacklistMedia
      : [blacklistMedia];
    blacklisted = mediaMatches.some(
      (mediaMatch) => mediaString.indexOf(mediaMatch) !== -1
    );
  }

  return whitelisted !== false && blacklisted !== true;
}

function ruleIsAllowed(ruleString: string, options: Options) {
  if (!options || !ruleString) return false;

  let whitelisted = true;
  let blacklisted = false;

  const whitelistRules = options.whitelist && options.whitelist?.rule;
  if (whitelistRules) {
    const ruleMatches = Array.isArray(whitelistRules)
      ? whitelistRules
      : [whitelistRules];
    whitelisted = ruleMatches.some(
      (ruleMatch) => ruleString.indexOf(ruleMatch) !== -1
    );
  }

  const blacklistRules = options.blacklist && options.blacklist.rule;
  if (blacklistRules) {
    const ruleMatches = Array.isArray(blacklistRules)
      ? blacklistRules
      : [blacklistRules];
    blacklisted = ruleMatches.some(
      (ruleMatch) => ruleString.indexOf(ruleMatch) !== -1
    );
  }

  return whitelisted !== false && blacklisted !== true;
}

export function mergeMatches(matchedCSSArray: CSSSniffRoot[]): CSSSniffRoot {
  // Via https://stackoverflow.com/a/34749873
  const isObject = (item: any): boolean => {
    return item && typeof item === "object" && !Array.isArray(item);
  };

  // @ts-ignore
  type NestedObject = Record<string, NestedObject>;

  const mergeDeep = (
    target: NestedObject,
    ...sources: NestedObject[]
  ): NestedObject => {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
      for (const key in source) {
        if (isObject(source[key])) {
          if (!target[key]) {
            target[key] = {};
          }
          const matchedCSS = target[key];
          if (!matchedCSS) {
            throw Error("Expected to be able to create key");
          }
          mergeDeep(matchedCSS, source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }
    return mergeDeep(target, ...sources);
  };
  return mergeDeep({}, ...matchedCSSArray);
}

export function serializeCSSMatches(matchedCSS: CSSSniffRoot): string {
  let css = "";

  Object.keys(matchedCSS).forEach((sheetIndex: string) => {
    const sheet = matchedCSS[sheetIndex];

    Object.keys(sheet).forEach((ruleIndex: string) => {
      const rule = sheet[ruleIndex];
      if (rule.type === "CSSSniffStyleRule") {
        css += rule.selectors.join(",");
        css += "{";
        css += rule.properties;
        css += "}";
      } else if (rule.type === "CSSSniffMediaRule") {
        css += rule.before;
        css += "{";
        Object.keys(rule.children).forEach((childRuleIndex: string) => {
          const childRule = rule.children[childRuleIndex];
          if (childRule.type === "CSSSniffStyleRule") {
            css += childRule.selectors.join(",");
            css += "{";
            css += childRule.properties;
            css += "}";
          } else {
            throw Error("Can't serialize invalid CSS structure");
          }
        });
        css += "}";
      }
    });
  });

  return css;
}

export function serializeCSSMatchesAsProperties(
  matchedCSS: CSSSniffRoot
): string {
  return Object.values(matchedCSS)
    .map((sheet): string => {
      return Object.values(sheet)
        .map((rule): string => {
          if (rule.type === "CSSSniffStyleRule") {
            return rule.properties;
          } else if (rule.type === "CSSSniffMediaRule") {
            return `${rule.before}{${Object.values(rule.children)
              .map((childRule): string => {
                if (childRule.type === "CSSSniffStyleRule") {
                  return childRule.properties;
                }
                throw Error("Invalid structure");
              })
              .join("")}}`;
          }
          throw Error(`Unknown type.`);
        })
        .join("");
    })
    .join(";")
    .trim();
}

export function cssRootDiff(a: CSSSniffRoot, b: CSSSniffRoot): CSSSniffRoot {
  const diff: CSSSniffRoot = {};

  Object.keys(b).forEach((bSheetIndex) => {
    const bSheet = b[bSheetIndex];
    Object.keys(bSheet).forEach((bRuleIndex) => {
      const bRule = bSheet[bRuleIndex];
      let diffStyleSheet: CSSSniffStyleSheet = diff[bSheetIndex] || {};
      if (bRule.type === "CSSSniffStyleRule") {
        if (!a[bSheetIndex] || !a[bSheetIndex][bRuleIndex]) {
          diffStyleSheet[bRuleIndex] = bRule;
          diff[bSheetIndex] = diffStyleSheet;
        }
      } else if (bRule.type === "CSSSniffMediaRule") {
        const diffRule = diff[bSheetIndex] && diff[bSheetIndex][bRuleIndex];
        if (diffRule && diffRule.type !== "CSSSniffMediaRule") {
          throw Error(`Cannot change type of diff`);
        }
        const aRule = a[bSheetIndex] && a[bSheetIndex][bRuleIndex];
        if (aRule && aRule.type !== "CSSSniffMediaRule") {
          throw Error(`Cannot change type of (a)`);
        }
        const diffChildren = diffRule.children || {};
        Object.keys(bRule.children).forEach((bRuleChildIndex) => {
          if (!aRule || !aRule.children[bRuleChildIndex]) {
            diffChildren[bRuleChildIndex] = bRule.children[bRuleChildIndex];
          }
        });
        if (Object.keys(diffChildren).length > 0) {
          diffStyleSheet[bRuleIndex] = {
            ...bRule,
            children: diffChildren,
          };
          diff[bSheetIndex] = diffStyleSheet;
        }
      }
    });
  });

  return diff;
}

export function splitSelectors(selectors: string): string[] {
  /*
    split-css-selector by Joakim Carlstein (C) 2015 for
    function 'splitSelectors'. Licenced under MIT
  */
  function isAtRule(selector: string): boolean {
    return selector.indexOf("@") === 0;
  }

  if (isAtRule(selectors)) {
    return [selectors];
  }

  var splitted = [];
  var parens = 0;
  var angulars = 0;
  var soFar = "";
  for (var i = 0, len = selectors.length; i < len; i++) {
    var char = selectors[i];
    if (char === "(") {
      parens += 1;
    } else if (char === ")") {
      parens -= 1;
    } else if (char === "[") {
      angulars += 1;
    } else if (char === "]") {
      angulars -= 1;
    } else if (char === ",") {
      if (!parens && !angulars) {
        splitted.push(soFar.trim());
        soFar = "";
        continue;
      }
    }
    soFar += char;
  }
  splitted.push(soFar.trim());
  return splitted;
}

const unique = `css-sniff-placeholder`;
