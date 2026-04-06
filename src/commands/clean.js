const path = require("path");
const { emptyDir, pathExists } = require("../utils/fs");
const { loadConfig } = require("./build");

async function cleanSite(context, args) {
  const rootDir = getFlag(args, "--root") ? path.resolve(context.cwd, getFlag(args, "--root")) : context.rootDir;
  const config = await loadConfig(rootDir);
  const distDir = path.join(rootDir, config.outDir);

  if (!(await pathExists(distDir))) {
    console.log(`Nothing to clean. ${distDir} does not exist.`);
    return;
  }

  await emptyDir(distDir);
  console.log(`Cleaned ${distDir}`);
}

function getFlag(args, name) {
  const index = args.indexOf(name);
  if (index === -1) {
    return null;
  }
  return args[index + 1] || null;
}

module.exports = { cleanSite };
