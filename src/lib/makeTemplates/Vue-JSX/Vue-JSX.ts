import prettier from "prettier/standalone";
import parserTypeScript from "prettier/parser-typescript";
import { TemplateFormat, OnConstructor } from "../Template";
import { ReactTemplate, FragmentStrings } from "../React/React";
import { TemplateFiles } from "../../types";
import { validJavaScriptIdentifer } from "../utils";

const fragmentStrings: FragmentStrings = {
  start: "<Fragment>",
  end: "</Fragment>",
};

export class VueJSXTemplate extends ReactTemplate {
  render: string;
  vue: string;
  fragmentStrings: FragmentStrings;

  constructor(args: OnConstructor) {
    super({ ...args, fragmentStrings, dirname: args.dirname || "vue-jsx" });

    this.render = "";
    this.vue = "";
    this.fragmentStrings = fragmentStrings;
    this.renderPropType = this.renderPropType.bind(this);
  }

  renderPropType(propId: string): string {
    const prop = this.props[propId];
    let propString = "";

    propString += validJavaScriptIdentifer.test(propId)
      ? propId
      : `"${propId}"`;

    if (!prop.required) {
      propString += "?";
    }

    propString += ": ";

    switch (prop.type) {
      case "PropTypeVariable": {
        propString += "Object as () => Vue.VNode";
        break;
      }
      case "PropTypeAttributeValue": {
        propString += `String as () => string`;
        break;
      }
      case "PropTypeAttributeValueOptions": {
        propString += `Object as () => ${Object.keys(prop.options)
          .map((key) => {
            return validJavaScriptIdentifer.test(key) ? `"${key}"` : `"${key}"`;
          })
          .join(" | ")}`;
      }
    }

    return propString;
  }

  onFinalise(
    onFinalise: Parameters<TemplateFormat["onFinalise"]>[0]
  ): undefined {
    const result = super.onFinalise(onFinalise);
    if (!result) {
      throw Error("expected onFinalise result from React template.");
    }

    const propsString = `props: {\n    ${Object.keys(this.props)
      .map(this.renderPropType)
      .join(",\n    ")}\n  },`;

    const spreadConstProps = `const { ${Object.keys(this.props)
      .filter((propId) => validJavaScriptIdentifer.test(propId))
      .join(", ")} } = props;`;

    this.vue = `// Vue3 Fragment component\nimport Vue, { Fragment } from 'vue';\n\nexport default Vue.component(${JSON.stringify(
      this.templateId
    )}, {\n  functional: true,\n  ${propsString}\n  render: function(h, context) {\n    const { props } = context;\n    ${spreadConstProps}\n    return (${
      this.hasMultipleRootNodes ? "<Fragment>" : ""
    }${result.render}${this.hasMultipleRootNodes ? "</Fragment>" : ""})\n }})`;

    try {
      this.vue = prettier.format(this.vue, {
        parser: "typescript",
        printWidth: 80,
        plugins: [parserTypeScript],
      });
    } catch (e) {
      // pass
    }

    return;
  }

  serialize(): TemplateFiles {
    return {
      [`${this.dirname}/${this.templateId}.ts`]: this.vue,
    };
  }
}
