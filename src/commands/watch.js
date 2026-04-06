const path = require("path");
const { buildSite } = require("./build");

async function watchSite(context, args) {
  const rootDir = getFlag(args, "--root") ? path.resolve(context.cwd, getFlag(args, "--root")) : context.rootDir;
  const fs = require("fs");
  const watchTarget = path.join(rootDir, "src");

  await buildSite({ ...context, rootDir }, []);
  console.log(`Watching ${watchTarget} for changes...`);

  let timeoutId = null;
  const watcher = fs.watch(watchTarget, { recursive: true }, () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(async () => {
      try {
        await buildSite({ ...context, rootDir }, []);
        console.log(`Rebuilt at ${new Date().toLocaleTimeString()}`);
      } catch (error) {
        console.error(`[blizt] Watch rebuild failed: ${error.message}`);
      }
    }, 80);
  });

  process.on("SIGINT", () => {
    watcher.close();
    console.log("Stopping Blizt watch mode.");
    process.exit(0);
  });
}

function getFlag(args, name) {
  const index = args.indexOf(name);
  if (index === -1) {
    return null;
  }
  return args[index + 1] || null;
}

module.exports = { watchSite };
