# MetaComponent 🦚

MetaComponent is a web template generator that can take a single component definition and output...

- [*] CSS
- [*] HTML
- [*] React (TypeScript)
- [*] React with Styled-Components
- [ ] Vue _(beta)_
- [ ] Angular _(beta)_
- [ ] Mustache/Handlebars _(beta)_
- [ ] Twig (Drupal / PHP) _(beta)_

This is particularly useful for Design Systems and Pattern Libraries where a single template definition could be converted into multiple formats.

## :gift: Features

- [+] Single-source template generator.
- [+] MetaComponent bundles only the CSS relevant to your HTML, so give it your whole CSS file and then MetaComponent will try to 'tree shake' your CSS, SCSS, and Styled Components declarations.
- [ ] It can generate code examples to show example usage of these component formats.

## Install

`npm i @springload/MetaComponent` or `yarn add @springload/MetaComponent`.

## :crystal_ball: Future

- More template formats... contribute your favourite!
- Better CSS support.

## :warning: Limitations

- The CSS 'tree shaking' can't handle complicated CSS such as `:not(.class)` and probably other features too, so check the output formats yourself. Instead it prefers a BEM approach.

## :satellite: API

TypeScript types are provided.

_TODO_

#### MetaHTML ?

The reason why we need to use non-standard HTML is to know which parts should be configurable, as variables.

MetaHTML is standard HTML with two types of template variables:

- Those variables in attribute values:
  - For making a required variable string: `{{ variableName }}` eg `<span class="{{ class }}">`
    - Use a `?` after the variable name to make it optional
    - Multiple variables can exist in an attribute value, write them like `<span class="{{ class }}{{ otherClass }}">`
  - For making a required variable with enumerations `{{ variableName: option1 | option2 }}` eg `<span class="{{ color: class-red | class-blue }}">`
  - For making a variable with enumerations that have friendly names `{{ variableName: option1 as Option1 | option2 as Option2 }}` eg `&lt;span class="{{ color: class-red as Red | class-blue as Blue }}"&gt;`
- Those variables that are childNodes between elements:
  - Use `<mt-variable key="variableName">default value</mt-variable>` eg if you want a component variable named "children" in an `&lt;h1&gt;` you'd write `<h1><mt-variable key="children">placeholder</mt-variable></h1>`

There is also template `if` support as `<mt-if key="isShown">thing to show</mt-if>`.

# Out of scope

- Loops. We support `children` values (childNodes) so you could just nest other components instead. Maybe we don't need this.
