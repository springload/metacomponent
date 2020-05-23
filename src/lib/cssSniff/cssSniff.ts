type Options = {
  ignoreChildren?: boolean;
  whitelist?: { stylesheet?: string; media?: string; rule?: string };
  blacklist?: { stylesheet?: string; media?: string; rule?: string };
};

export type MatchedCSS = {
  [index: string]: {
    before?: string;
    selectors?: string[];
    after?: string;
    children?: MatchedCSS;
    properties?: string;
  };
};

export function cssSniff(
  children: ChildNode[],
  options: Options,
  matchedCSS?: MatchedCSS
): MatchedCSS {
  const matched: MatchedCSS = matchedCSS || {};

  children.forEach((child) => {
    if (child.nodeType !== Node.ELEMENT_NODE) {
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
  matched: MatchedCSS
): void {
  if (el.nodeType !== Node.ELEMENT_NODE) {
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
      const matchedCSSRule = _filterCSSRulesByElement(
        el,
        cssRulesArray,
        options,
        matched || {}
      );
      if (matchedCSSRule) {
        matched[i] = matchedCSSRule;
      }
    }
  }
}

function _filterCSSRulesByElement(
  el: HTMLElement,
  rules: CSSRule[],
  options: Options,
  matched: MatchedCSS
): MatchedCSS | void {
  for (let i in rules) {
    const rule = rules[i];

    if (rule instanceof CSSStyleRule) {
      const sanitisedSelector = rule.selectorText.replace(/@charset.*?;/g, "");

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
            // respectively.
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
              matched[i] = {
                selectors: (matched[i] && matched[i].selectors) || [],
                properties: rule.cssText.substring(rule.cssText.indexOf("{")),
              };
              if (matched[i].selectors?.indexOf(selector) === -1) {
                matched[i].selectors?.push(selector);
              }
            }
          } catch (e) {
            const isCharset = "@charset".indexOf(rule.selectorText) !== -1;
            if (isCharset) {
              console.error(
                "ERROR",
                rule.type,
                `[${trimmedSelector}]`,
                `[[${normalizedSelector}]]`,
                `(((${rule.selectorText})))`,
                e
              );
            }
          }
        });
      }
    } else if (rule instanceof CSSMediaRule) {
      const conditionText = rule.conditionText || rule.media[0];
      if (mediaIsAllowed(conditionText, options)) {
        // a nested rule like @media { rule { ... } }
        // so we filter the rules inside individually
        const cssRulesArray = Array.from(rule.cssRules);

        const nestedRules = _filterCSSRulesByElement(
          el,
          cssRulesArray,
          options,
          {}
        );

        if (nestedRules) {
          matched[i] = {
            before: "@media " + conditionText + " {",
            children: nestedRules,
            after: "}",
          };
        }
      }
    }
  }
  return Object.keys(matched).length ? matched : undefined;
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

export function mergeMatches(matchedCSSArray: MatchedCSS[]): MatchedCSS {
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

export function serializeCSSMatches(matchedCSS: MatchedCSS): string {
  if (!matchedCSS) return "";
  const response = Object.keys(matchedCSS)
    .map((key: string) => {
      const rule = matchedCSS[key];
      let css = "";
      if (!rule) {
        throw Error(
          `css-sniff: serializeCSSRules() key: "${key}", value: ${JSON.stringify(
            rule
          )}`
        );
      }
      if (rule.selectors) {
        css += rule.selectors.join(",");
        css += rule.properties;
      } else if (rule.before && rule.children) {
        css += rule.before;
        css += serializeCSSMatches(rule.children);
        css += rule.after;
      } else if (rule instanceof Object) {
        // @ts-ignore
        const matchedCSS: MatchedCSS = rule;
        css += serializeCSSMatches(matchedCSS);
      }
      return css;
    })
    .join("");

  return response;
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
