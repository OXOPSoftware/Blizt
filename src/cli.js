const path = require("path");
const { createSite } = require("./commands/create");
const { buildSite } = require("./commands/build");
const { serveSite } = require("./commands/serve");
const { watchSite } = require("./commands/watch");
const { cleanSite } = require("./commands/clean");
const { listTemplates, renderHelp, renderVersion, renderInfo } = require("./commands/meta");

async function run(argv) {
  const [command = "help", ...rest] = argv;

  if (command === "help" || command === "--help" || command === "-h") {
    console.log(renderHelp());
    return;
  }

  if (command === "version" || command === "--version" || command === "-v") {
    console.log(renderVersion());
    return;
  }

  const cwd = process.cwd();
  const context = {
    cwd,
    rootDir: cwd,
    packageRoot: path.resolve(__dirname, "..")
  };

  switch (command) {
    case "create":
      await createSite(context, rest);
      return;
    case "build":
      await buildSite(context, rest);
      return;
    case "serve":
      await serveSite(context, rest);
      return;
    case "watch":
      await watchSite(context, rest);
      return;
    case "clean":
      await cleanSite(context, rest);
      return;
    case "templates":
      console.log(listTemplates());
      return;
    case "info":
      console.log(renderInfo(context));
      return;
    default:
      console.log(renderHelp(`Unknown command: ${command}`));
  }
}

module.exports = { run };
