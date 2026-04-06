const http = require("http");
const fs = require("fs");
const path = require("path");
const { buildSite, loadConfig } = require("./build");
const { pathExists } = require("../utils/fs");

async function serveSite(context, args) {
  const mode = args[0] && !args[0].startsWith("--") ? args[0] : "production";
  const rootDir = getFlag(args, "--root") ? path.resolve(context.cwd, getFlag(args, "--root")) : context.rootDir;
  const port = Number(getFlag(args, "--port") || 5000);

  if (mode === "dev") {
    await buildSite({ ...context, rootDir }, []);
  }

  const config = await loadConfig(rootDir);
  const distDir = path.join(rootDir, config.outDir);

  if (!(await pathExists(distDir))) {
    throw new Error(`Could not find dist directory at ${distDir}. Run "blizt build" first.`);
  }

  const server = http.createServer(async (request, response) => {
    try {
      if (mode === "dev") {
        await buildSite({ ...context, rootDir }, []);
      }

      const requestPath = normalizeRequestPath(request.url || "/");
      const filePath = path.join(distDir, requestPath);
      const resolvedPath = await resolveFilePath(distDir, filePath);

      if (!resolvedPath) {
        response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Not found");
        return;
      }

      const body = await fs.promises.readFile(resolvedPath);
      response.writeHead(200, {
        "Content-Type": getContentType(resolvedPath),
        "Cache-Control": mode === "dev" ? "no-store" : "public, max-age=300"
      });
      response.end(body);
    } catch (error) {
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end(`Server error: ${error.message}`);
    }
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, () => resolve());
  });

  console.log(`Blizt ${mode} server running at http://localhost:${port}`);
  console.log(`Serving files from ${distDir}`);
}

async function resolveFilePath(distDir, filePath) {
  const normalized = path.normalize(filePath);
  if (!normalized.startsWith(path.normalize(distDir))) {
    return null;
  }

  if (await pathExists(normalized)) {
    const stats = await require("fs").promises.stat(normalized);
    if (stats.isDirectory()) {
      const indexPath = path.join(normalized, "index.html");
      return (await pathExists(indexPath)) ? indexPath : null;
    }
    return normalized;
  }

  const htmlPath = normalized.endsWith(".html") ? normalized : `${normalized}.html`;
  return (await pathExists(htmlPath)) ? htmlPath : null;
}

function normalizeRequestPath(url) {
  const pathname = url.split("?")[0];
  const cleaned = pathname === "/" ? "/index.html" : pathname;
  return cleaned.replace(/^\/+/, "");
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".css":
      return "text/css; charset=utf-8";
    case ".js":
      return "text/javascript; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".svg":
      return "image/svg+xml";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    default:
      return "text/html; charset=utf-8";
  }
}

function getFlag(args, name) {
  const index = args.indexOf(name);
  if (index === -1) {
    return null;
  }
  return args[index + 1] || null;
}

module.exports = { serveSite };
