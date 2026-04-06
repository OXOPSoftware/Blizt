const path = require("path");
const { ensureDir, emptyDir, pathExists, readJson, readText, writeText, copyDirectory } = require("../utils/fs");
const { renderBliztDocument, renderHtmlDocument, toSlug, stripExtension, htmlEscape } = require("../utils/render");

async function buildSite(context, args = []) {
  const rootDir = getFlag(args, "--root") ? path.resolve(context.cwd, getFlag(args, "--root")) : context.rootDir;
  const config = await loadConfig(rootDir);
  const srcDir = path.join(rootDir, config.srcDir);
  const distDir = path.join(rootDir, config.outDir);
  const pagesDir = path.join(srcDir, "pages");
  const publicDir = path.join(srcDir, "public");

  if (!(await pathExists(srcDir))) {
    throw new Error(`Could not find source directory at ${srcDir}`);
  }

  await ensureDir(distDir);
  await emptyDir(distDir);

  const pageEntries = await collectPageEntries(pagesDir);
  const navigation = pageEntries.map((entry) => ({
    title: entry.meta.title || prettyName(entry.baseName),
    href: entry.outputPath === "index.html" ? "/" : `/${entry.outputPath.replace(/\\/g, "/")}`
  }));

  for (const entry of pageEntries) {
    const templateData = {
      siteName: config.siteName,
      title: entry.meta.title || prettyName(entry.baseName),
      description: entry.meta.description || config.description,
      pageClass: toSlug(entry.baseName),
      navigation: renderNavigation(navigation, entry.outputPath),
      content: entry.content,
      year: new Date().getFullYear().toString()
    };

    const html = entry.type === "blizt"
      ? renderBliztDocument(entry.rawBody, templateData)
      : renderHtmlDocument(entry.rawBody, templateData);

    const outputFile = path.join(distDir, entry.outputPath);
    await ensureDir(path.dirname(outputFile));
    await writeText(outputFile, html);
  }

  const stylesSource = path.join(srcDir, "styles.css");
  if (await pathExists(stylesSource)) {
    await writeText(path.join(distDir, "styles.css"), await readText(stylesSource));
  }

  if (await pathExists(publicDir)) {
    await copyDirectory(publicDir, distDir);
  }

  console.log(`Built ${pageEntries.length} page(s) into ${distDir}`);
  return { rootDir, distDir, config };
}

async function loadConfig(rootDir) {
  const configPath = path.join(rootDir, "blizt.config.json");
  const config = (await pathExists(configPath)) ? await readJson(configPath) : {};

  return {
    siteName: config.siteName || "Blizt Site",
    description: config.description || "Built with Blizt",
    srcDir: config.srcDir || "src",
    outDir: config.outDir || "dist"
  };
}

async function collectPageEntries(pagesDir) {
  if (!(await pathExists(pagesDir))) {
    throw new Error(`Could not find pages directory at ${pagesDir}`);
  }

  const files = await walkPages(pagesDir);
  const pages = [];

  for (const filePath of files) {
    const relativePath = path.relative(pagesDir, filePath);
    const extension = path.extname(filePath).toLowerCase();
    const baseName = stripExtension(path.basename(filePath));
    const parsed = await parsePage(filePath, extension);
    const outputPath = relativePath.replace(/\.(bs|html)$/i, ".html");

    pages.push({
      ...parsed,
      baseName,
      outputPath
    });
  }

  pages.sort((a, b) => comparePageOrder(a.outputPath, b.outputPath));
  return pages;
}

async function walkPages(currentDir) {
  const items = await require("fs").promises.readdir(currentDir, { withFileTypes: true });
  const results = [];

  for (const item of items) {
    const fullPath = path.join(currentDir, item.name);
    if (item.isDirectory()) {
      results.push(...await walkPages(fullPath));
      continue;
    }

    if (/\.(bs|html)$/i.test(item.name)) {
      results.push(fullPath);
    }
  }

  return results;
}

async function parsePage(filePath, extension) {
  const source = await readText(filePath);
  const { meta, body } = parseFrontmatter(source);

  return {
    type: extension === ".bs" ? "blizt" : "html",
    rawBody: body.trim(),
    meta,
    content: body.trim()
  };
}

function parseFrontmatter(source) {
  const meta = {};
  const bodyLines = [];

  for (const line of source.replace(/\r\n/g, "\n").split("\n")) {
    const trimmed = line.trim();

    if (trimmed.startsWith("@")) {
      const separatorIndex = trimmed.indexOf(" ");
      if (separatorIndex !== -1) {
        const key = trimmed.slice(1, separatorIndex).trim();
        const value = trimmed.slice(separatorIndex + 1).trim();
        meta[key] = value;
        continue;
      }
    }

    bodyLines.push(line);
  }
  return { meta, body: bodyLines.join("\n") };
}

function renderNavigation(items, currentOutputPath) {
  return [...items].sort((left, right) => {
    if (left.href === "/") {
      return -1;
    }
    if (right.href === "/") {
      return 1;
    }
    return left.href.localeCompare(right.href);
  }).map((item) => {
    const isCurrent = (
      item.href === "/" && currentOutputPath === "index.html"
    ) || item.href === `/${currentOutputPath.replace(/\\/g, "/")}`;

    return `<a href="${htmlEscape(item.href)}"${isCurrent ? ' aria-current="page"' : ""}>${htmlEscape(item.title)}</a>`;
  }).join("");
}

function prettyName(value) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function comparePageOrder(left, right) {
  if (left === "index.html") {
    return -1;
  }
  if (right === "index.html") {
    return 1;
  }
  return left.localeCompare(right);
}

function getFlag(args, name) {
  const index = args.indexOf(name);
  if (index === -1) {
    return null;
  }
  return args[index + 1] || null;
}

module.exports = { buildSite, loadConfig };
