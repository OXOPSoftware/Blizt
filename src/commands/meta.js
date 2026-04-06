const packageJson = require("../../package.json");

function renderHelp(message) {
  const lines = [];

  if (message) {
    lines.push(message, "");
  }

  lines.push(`Blizt ${packageJson.version}`);
  lines.push("A tiny Node.js web engine for static HTML sites.");
  lines.push("");
  lines.push("Usage:");
  lines.push("  blizt create <name> [--template basic] [--force]");
  lines.push("  blizt build");
  lines.push("  blizt serve <production|dev> [--port 5000]");
  lines.push("  blizt watch");
  lines.push("  blizt clean");
  lines.push("  blizt templates");
  lines.push("  blizt info");
  lines.push("");
  lines.push("Command ideas for later:");
  lines.push("  blizt new page <name>       Create a new .bs page from a preset.");
  lines.push("  blizt deploy                Push the generated dist folder somewhere.");
  lines.push("  blizt lint                  Validate site config, links, and frontmatter.");
  lines.push("  blizt plugin add <name>     Expand Blizt with new builders or content types.");
  lines.push("");
  lines.push("Examples:");
  lines.push("  npx blizt create my-site");
  lines.push("  npx blizt build");
  lines.push("  npx blizt serve dev");
  lines.push("  npx blizt watch");

  return lines.join("\n");
}

function renderVersion() {
  return packageJson.version;
}

function listTemplates() {
  return [
    "Available templates:",
    "  basic   Starter marketing-style static site with .bs pages"
  ].join("\n");
}

function renderInfo(context) {
  return [
    `Name: ${packageJson.name}`,
    `Version: ${packageJson.version}`,
    `Working directory: ${context.cwd}`,
    "Commands: create, build, serve, watch, clean, templates, info"
  ].join("\n");
}

module.exports = {
  listTemplates,
  renderHelp,
  renderVersion,
  renderInfo
};
