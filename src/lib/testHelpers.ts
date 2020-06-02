import { generateTemplates } from "./index";
import jsdom from "jsdom";

export function callMetaComponent(
  templateId: string,
  metaHTMLString: string,
  cssString: string,
  haltOnErrors: boolean
): ReturnType<typeof generateTemplates> {
  const { JSDOM } = jsdom;
  const jsdomInstance = new JSDOM(``, { pretendToBeVisual: true });
  const result = generateTemplates({
    // @ts-ignore
    domDocument: jsdomInstance.window.document,
    templateId,
    metaHTMLString,
    cssString,
    haltOnErrors,
  });
  jsdomInstance.window.close();
  return result;
}
