import { MetaNodeInternal } from "./metaComponent";
import { Log } from "../log";
import { MetaAttributeVariableOptions } from "./parseMetaHTMLAttribute";

type PropTypeAttributeValue = {
  type: "PropTypeAttributeValue";
  required: boolean;
  nodeName: string;
  attributeName: string;
};

type PropTypeAttributeValueOptions = {
  type: "PropTypeAttributeValueOptions";
  required: boolean;
  nodeName: string;
  attributeName: string;
  options: MetaAttributeVariableOptions["options"];
};

type PropTypeVariable = {
  type: "PropTypeVariable";
  required: boolean;
};

// These are return props not the props given to this function
export type Props = Record<
  string,
  PropTypeAttributeValue | PropTypeAttributeValueOptions | PropTypeVariable
>;

export function getProps(nodes: MetaNodeInternal[], log: Log): Props {
  const props: Props = {};

  const walk = (node: MetaNodeInternal) => {
    switch (node.type) {
      case "Element":
        {
          const attributeNames = Object.keys(node.attributes);
          attributeNames.forEach((attributeName) => {
            const attributeValueParts = node.attributes[attributeName];
            attributeValueParts.forEach((attributeValuePart) => {
              if (attributeValuePart.type === "MetaAttributeVariable") {
                if (!attributeValuePart.id) {
                  log(
                    `Ignoring empty prop id. ${JSON.stringify(
                      attributeValuePart
                    )} from ${JSON.stringify(node)}`
                  );
                  return;
                }
                if (
                  props[attributeValuePart.id] &&
                  props[attributeValuePart.id].type ===
                    "PropTypeAttributeValueOptions"
                ) {
                  return; // don't clobber with a less-specific typing than options
                }
                props[attributeValuePart.id] = {
                  type: "PropTypeAttributeValue",
                  required: attributeValuePart.required,
                  nodeName: node.nodeName,
                  attributeName,
                };
              } else if (
                attributeValuePart.type === "MetaAttributeVariableOptions"
              ) {
                if (!attributeValuePart.id) {
                  log(
                    `Ignoring empty prop id. ${JSON.stringify(
                      attributeValuePart
                    )} from ${JSON.stringify(node)}`
                  );
                  return;
                }
                props[attributeValuePart.id] = {
                  type: "PropTypeAttributeValueOptions",
                  required: attributeValuePart.required,
                  nodeName: node.nodeName,
                  attributeName,
                  options: attributeValuePart.options,
                };
              }
            });
          });
          node.children.forEach(walk);
        }
        break;
      case "If":
        if (node.parseError === false) {
          node.ids.forEach((id) => {
            if (!id) {
              log(`Ignoring empty prop id from ${JSON.stringify(node)}`);
              return;
            }
            if (props[id]) return; // don't clobber a more specific typing

            props[id] = {
              type: "PropTypeVariable",
              required: !node.optional,
            };
          });
        }
        node.children.forEach(walk);
        break;
      case "Variable": {
        if (!node.id) {
          log(`Ignoring empty prop id from ${JSON.stringify(node)}`);
          break;
        }
        if (props[node.id]) {
          // don't clobber a more specific typing
          // but making it optional is ok
          if (node.optional) {
            props[node.id].required = false;
          }
          return;
        }
        props[node.id] = {
          type: "PropTypeVariable",
          required: !node.optional,
        };
        node.children.forEach(walk);
        break;
      }
    }
  };

  nodes.forEach(walk);

  return props;
}
