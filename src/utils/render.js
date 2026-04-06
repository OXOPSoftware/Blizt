function renderBliztDocument(source, data) {
  const content = bliztToHtml(source);
  return wrapHtml(content, data);
}

function renderHtmlDocument(html, data) {
  return wrapHtml(html, data);
}

function wrapHtml(content, data) {
  const title = htmlEscape(data.title || data.siteName || "Blizt Site");
  const description = htmlEscape(data.description || "");
  const siteName = htmlEscape(data.siteName || "Blizt Site");
  const pageClass = htmlEscape(data.pageClass || "page");
  const navigation = data.navigation || "";
  const year = htmlEscape(data.year || "");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title}</title>
    <meta name="description" content="${description}">
    <link rel="stylesheet" href="/styles.css">
  </head>
  <body class="${pageClass}">
    <div class="shell">
      <header class="hero">
        <a class="brand" href="/">${siteName}</a>
        <nav class="nav">${navigation}</nav>
      </header>
      <main class="content">
${indentHtml(content, 8)}
      </main>
      <footer class="footer">
        <p>Built with Blizt. ${year}</p>
      </footer>
    </div>
  </body>
</html>
`;
}

function bliztToHtml(source) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const htmlBlocks = [];
  let listItems = [];

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const line = rawLine.trim();

    if (!line || line.startsWith("@")) {
      flushList();
      continue;
    }

    if (line === "code:" || line === "html:") {
      flushList();
      const blockType = line.slice(0, -1);
      const bodyLines = [];
      index += 1;

      while (index < lines.length && lines[index].trim() !== "end") {
        bodyLines.push(lines[index]);
        index += 1;
      }

      if (blockType === "code") {
        htmlBlocks.push(`<pre><code>${htmlEscape(bodyLines.join("\n"))}</code></pre>`);
      } else {
        htmlBlocks.push(bodyLines.join("\n"));
      }

      continue;
    }

    const match = line.match(/^(h[1-6]|p|li|quote):\s*(.*)$/);
    if (!match) {
      flushList();
      htmlBlocks.push(`<p>${inlineBlizt(line)}</p>`);
      continue;
    }

    const [, type, value] = match;
    if (type === "li") {
      listItems.push(`<li>${inlineBlizt(value)}</li>`);
      continue;
    }

    flushList();

    if (type === "quote") {
      htmlBlocks.push(`<blockquote><p>${inlineBlizt(value)}</p></blockquote>`);
      continue;
    }

    if (type === "p") {
      htmlBlocks.push(`<p>${inlineBlizt(value)}</p>`);
      continue;
    }

    htmlBlocks.push(`<${type}>${inlineBlizt(value)}</${type}>`);
  }

  flushList();
  return htmlBlocks.join("\n");

  function flushList() {
    if (listItems.length === 0) {
      return;
    }

    htmlBlocks.push(`<ul>${listItems.join("")}</ul>`);
    listItems = [];
  }
}

function inlineBlizt(value) {
  return htmlEscape(value)
    .replace(/\[br\]/g, "<br>")
    .replace(/\[strong:(.+?)\]/g, "<strong>$1</strong>")
    .replace(/\[em:(.+?)\]/g, "<em>$1</em>")
    .replace(/\[code:(.+?)\]/g, "<code>$1</code>")
    .replace(/\[link:([^|\]]+)\|([^\]]+)\]/g, '<a href="$2">$1</a>');
}

function indentHtml(value, spaces) {
  const padding = " ".repeat(spaces);
  return value.split("\n").map((line) => `${padding}${line}`).join("\n");
}

function htmlEscape(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function toSlug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function stripExtension(fileName) {
  return fileName.replace(/\.[^.]+$/, "");
}

function replaceTokens(template, data) {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => {
    return data[key] == null ? "" : String(data[key]);
  });
}

module.exports = {
  renderBliztDocument,
  renderHtmlDocument,
  toSlug,
  stripExtension,
  htmlEscape,
  replaceTokens
};
