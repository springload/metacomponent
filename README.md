<center>
# MetaComponent 🦚
</center>

MetaComponent is a component generator that can convert a single component definition into...

- [x] HTML
- [x] CSS
- [x] React (TypeScript)
- [x] React with Styled-Components
- [x] Vue
- [x] Angular
- [x] Mustache/Handlebars
- [ ] Twig (Drupal / PHP)

This is particularly useful for Design Systems and Pattern Libraries where a single template definition could be converted into multiple formats.

## Why?

See [MetaComponent: Why?](https://springload.github.io/metacomponent#why).

## :gift: Features

- [x] Single-source template generator.
- [x] MetaComponent bundles only the CSS relevant to your HTML, so give it your whole CSS file and then MetaComponent will try to 'tree shake' your CSS, SCSS, and Styled Components declarations.
- [ ] It can generate code examples to show example usage of these component formats.

## Demo

Try the [MetaComponent REPL](https://springload.github.io/metacomponent).

## Install

`npm i metacomponent` or `yarn add metacomponent`.

## :crystal_ball: Future

- More template formats... contribute your favourite!
- Better CSS support.

# Out of scope

- Loops. We support `children` values (childNodes) so you could just nest other components instead. Maybe we don't need this.
