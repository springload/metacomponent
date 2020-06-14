# MetaComponent 🦚

MetaComponent is a component generator that can convert a single component definition into...

- [x] HTML
- [x] CSS
- [x] Mustache/Handlebars
- [x] Django
- [x] React
- [x] React with Styled-Components
- [x] Vue
- [x] Angular
- [ ] Twig (Drupal / PHP)

This is particularly useful for Design Systems and Pattern Libraries where a single template definition could be converted into multiple formats.

## Demo / Docs / Why?

Try the [MetaComponent REPL](https://springload.github.io/metacomponent).

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
