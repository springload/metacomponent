<center>
# MetaComponent 🦚

_the very front of the front-end._

</center>

## Why MetaComponent?

It's often the case that large organisations and governments, for a variety of reasons, have a large variety of frontend technology.

They use React, Angular, Vue, Handlebars, Jinja2, Twig, and more.

As a result, their organisation's websites feel very different.

If you wanted to unify that behaviour and appearance (HTML and CSS) an obvious answer is Design Systems (Pattern Libraries) to publish advice and components.

It would be a lot of manual work to support all of those web frameworks, so typically Design Systems choose HTML/CSS and only one additional format that they write manually, by hand. Essentially they declare one format the winner: Angular, React, Vue, Handlebars, or Nunjucks., and technology stacks that don't support that format are left to implement the HTML/CSS manually.

This approach solves one problem but it also creates a technical barrier that may hinder adoption of their Design System.

MetaComponent tries to complement Design Systems by generating components for each framework to make it easiser to adopt.

MetaComponent is a web component template generator that can take a single component definition and output components in...

- [x] HTML
- [x] CSS
- [x] React (TypeScript)
- [x] React with Styled-Components
- [ ] Vue
- [ ] Angular
- [ ] Mustache/Handlebars
- [ ] Twig (Drupal / PHP)

This is particularly useful for Design Systems and Pattern Libraries where a single template definition could be converted into multiple formats.

## :gift: Features

- [x] Single-source template generator.
- [x] MetaComponent bundles only the CSS relevant to your HTML, so give it your whole CSS file and then MetaComponent will try to 'tree shake' your CSS, SCSS, and Styled Components declarations.
- [ ] It can generate code examples to show example usage of these component formats.

## DEMO

Try the [MetaComponent REPL](https://springload.github.io/metacomponent).

## Install

`npm i @springload/MetaComponent` or `yarn add @springload/MetaComponent`.

## :crystal_ball: Future

- More template formats... contribute your favourite!
- Better CSS support.

## :warning: Limitations

- The CSS 'tree shaking' can't handle complicated CSS such as `:not(.class)` and probably other features too, so check the output formats yourself. Instead it prefers a BEM approach.

## :satellite: API

TypeScript types are provided.

_Docs TODO_

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
