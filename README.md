# MetaComponent 🦚

MetaComponent is a component generator that can convert a single component definition into...

- [x] HTML
- [x] CSS
- [x] React
- [x] React with Styled-Components 💅
- [x] Django
- [x] Mustache/Handlebars
- [x] Vue (beta)
- [x] Angular (beta)
- [x] Ember (alpha)
- [ ] Twig (Drupal / PHP)

This is particularly useful for Design Systems and Pattern Libraries where a single template definition could be converted into multiple formats.

## Demo / Docs

Try the [MetaComponent REPL](https://springload.github.io/metacomponent).

## Why?

Some of its use-cases are:

1. progressive enhancement of webapps, keeping serverside components in sync with clientside components.
2. providing components in multiple formats as an ongoing feature of a Design System or Pattern Library.
3. migrating to another component format (eg using legacy CSS to migrate to \`styled-components\`).
4. learning about similarities and differences in component formats.

<details>
    <summary>Use-case 2: design systems and pattern libraries</summary>

    It's often the case that governments and large organisations have
    websites that have very different websites and components, and
    these differences are often accidental or unnecessary.

    An obvious solution would be to make a Design System or Pattern
    Library where you'd publish components to unify HTML and CSS.

    However one stumbling block is when there's also a divergence in
    web component technology -- they use React, or Vue, Angular,
    Handlebars, Jinja2, Twig, and many, many more.

    It would be a lot of manual work to support all of those comonent
    formats, and so Design Systems and Pattern Libraries typically
    offer HTML/CSS, and maybe one additional format, and all of these
    are written by hand.

    Design Systems often solve one problem (standardising HTML/CSS)
    while creating new technical barriers that may hinder adoption.

    MetaComponent complements Design Systems Pattern Libraries by
    generating components for many frameworks to make it easiser to
    adopt.

</details>

## :gift: Features

- [x] Single-source template generator.
- [x] MetaComponent bundles only the CSS relevant to your HTML, so give it your whole CSS file and then MetaComponent will try to 'tree shake' your CSS, SCSS, and Styled Components declarations.
- [ ] It can generate code examples to show example usage of these component formats (TODO)

## Install

`npm i metacomponent` or `yarn add metacomponent`.

## :crystal_ball: Future

- More template formats... contribute your favourite!

## API

See `src/lib/testHelpers.ts` for example usage. It requires a DOM and we suggest you use JSDOM.

# Out of scope

- Loops. We support `children` values (arbitrary childNodes) so you could just nest other components instead. Maybe we don't need this.
- It produces TypeScript components and you could always convert that to JavaScript... so probably no need to produce JavaScript components directly, or perhaps a wrapper with Babel could be used to strip types.

# Command Line

MetaComponent 2.1.0 and later installs a `metacomponent-watcher` script in `node_modules/.bin/metacomponent-watcher` that takes two args `in` and `out` to watch a directory and output files. E.g.

```
node node_modules/.bin/metacomponent-watcher.js  --in some_dir --out some_other_dir
```
