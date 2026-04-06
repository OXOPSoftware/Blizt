const fs = require("fs");
const path = require("path");
const { copyDirectory, ensureDir, pathExists, readJson, writeJson } = require("../utils/fs");

async function createSite(context, args) {
  const targetName = args[0] && !args[0].startsWith("--") ? args[0] : "my-blizt-site";
  const template = getFlag(args, "--template") || "basic";
  const force = args.includes("--force");

  const templateDir = path.join(context.packageRoot, "templates", template);
  if (!fs.existsSync(templateDir)) {
    throw new Error(`Template "${template}" does not exist. Run "blizt templates" to see available options.`);
  }

  const projectDir = path.resolve(context.cwd, targetName);
  if (await pathExists(projectDir)) {
    const contents = await fs.promises.readdir(projectDir);
    if (contents.length > 0 && !force) {
      throw new Error(`Target directory "${targetName}" is not empty. Re-run with --force to continue.`);
    }
  } else {
    await ensureDir(projectDir);
  }

  await copyDirectory(templateDir, projectDir);
  await personalizeProject(projectDir, targetName);

  console.log(`Blizt site created in ${projectDir}`);
  console.log("");
  console.log("Next steps:");
  console.log(`  cd ${targetName}`);
  console.log("  npx blizt build");
  console.log("  npx blizt serve dev");
}

async function personalizeProject(projectDir, targetName) {
  const packageJsonPath = path.join(projectDir, "package.json");
  const configPath = path.join(projectDir, "blizt.config.json");

  if (await pathExists(packageJsonPath)) {
    const pkg = await readJson(packageJsonPath);
    pkg.name = targetName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "blizt-site";
    await writeJson(packageJsonPath, pkg);
  }

  if (await pathExists(configPath)) {
    const config = await readJson(configPath);
    config.siteName = titleize(targetName);
    await writeJson(configPath, config);
  }
}

function titleize(value) {
  return value
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getFlag(args, name) {
  const index = args.indexOf(name);
  if (index === -1) {
    return null;
  }
  return args[index + 1] || null;
}

module.exports = { createSite };
