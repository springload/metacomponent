#! /usr/bin/env node
// @ts-check
const cwd = require("process").cwd();
const argv = require("yargs").argv;
const path = require("path");
const fs = require("fs");
const chokidar = require("chokidar");
const mkdirp = require("mkdirp");
const { callMetaComponent } = require("../dist/testHelpers");

if (!argv.in || !argv.out) {
  console.info(
    "metacomponent-watcher requires both\n  --in INPUT_DIR\n  --out OUTPUT_DIR\npaths."
  );
  process.exit();
}

const inPath = path.join(cwd, argv.in.toString());
const inExists = fs.existsSync(inPath);
const outPath = path.join(cwd, argv.out.toString());
const outExists = fs.existsSync(outPath);

if (!inExists || !outExists) {
  console.error("Exiting because:");
  if (!inExists) {
    console.error(
      `ERROR: '--in' path resolved to "${inPath}" which doesn't exist.`
    );
  }
  if (!outExists) {
    console.error(
      `ERROR: '--out' path resolved to "${outPath}" which doesn't exist.`
    );
  }
  process.exit();
}

console.info(`Watching\n  ${inPath}\nWriting updates to\n  ${outPath}`);

chokidar.watch(inPath).on("all", (event, eventPath) => {
  if (
    event === "add" &&
    (eventPath.endsWith(".html") || eventPath.endsWith(".css"))
  ) {
    rebuild(eventPath, outPath);
  }
});

async function rebuild(fullPath, outPath) {
  const componentId = path.basename(fullPath, path.extname(fullPath));
  const dirPath = path.dirname(fullPath);
  const htmlPath = path.join(dirPath, `${componentId}.html`);
  const cssPath = path.join(dirPath, `${componentId}.css`);
  const metaHtml = await fs.promises.readFile(htmlPath, { encoding: "utf-8" });

  let css = "";

  try {
    const newCss = await fs.promises
      .readFile(cssPath, { encoding: "utf-8" })
      .catch((e) => {
        // pass
      });

    if (typeof newCss === "string") {
      css = newCss;
    }
  } catch (e) {
    // pass
  }

  const typeofMetaHtml = typeof metaHtml;
  const typeofCss = typeof css;

  if (typeofMetaHtml !== "string") {
    console.error(`Error typeof metaHtml = ${typeofMetaHtml}, ${metaHtml}`);
    return;
  }

  if (typeofCss !== "string") {
    css = "";
  }

  const result = await callMetaComponent(componentId, metaHtml, css, false);

  await Promise.all(
    Object.keys(result.files).map(async (filePath) => {
      const outFilePath = path.join(outPath, filePath);
      const outFileDir = path.dirname(outFilePath);
      await mkdirp(outFileDir);
      await fs.promises.writeFile(outFilePath, result.files[filePath], {
        encoding: "utf-8",
      });
    })
  );

  console.info(
    `${new Date()
      .toISOString()
      .replace(/\..*$/gi, "")
      .replace(/[^0-9:-]/gi, " ")} ${componentId} updated`
  );
}
