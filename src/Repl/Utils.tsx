import startCase from "lodash/startCase";

export function pathType(file: string) {
  return file.substring(0, file.indexOf("/"));
}

export function formatName(file: string): string | undefined {
  const dirname = pathType(file);
  if (dirname === "react-styled-components") {
    return "React with Styled Components 💅";
  }
  return undefined;
}

export function formatBriefName(file: string): string {
  const dirname = pathType(file);

  switch (dirname) {
    case "html":
      return "HTML";
    case "css":
      return "CSS";
    case "react-styled-components":
      return "React 💅";
    case "vue-jsx":
      return "Vue JSX";
    default:
      return startCase(dirname).replace(/-/g, " ");
  }
}

export const oneFrameMs = 1000 / 60;
