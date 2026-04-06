const fs = require("fs");
const path = require("path");

async function ensureDir(dirPath) {
  await fs.promises.mkdir(dirPath, { recursive: true });
}

async function emptyDir(dirPath) {
  await fs.promises.rm(dirPath, { recursive: true, force: true });
  await ensureDir(dirPath);
}

async function copyDirectory(fromDir, toDir) {
  await ensureDir(toDir);
  const entries = await fs.promises.readdir(fromDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(fromDir, entry.name);
    const targetPath = path.join(toDir, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, targetPath);
      continue;
    }

    await fs.promises.copyFile(sourcePath, targetPath);
  }
}

async function pathExists(targetPath) {
  try {
    await fs.promises.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath) {
  return JSON.parse(await fs.promises.readFile(filePath, "utf8"));
}

async function writeJson(filePath, value) {
  await fs.promises.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function readText(filePath) {
  return fs.promises.readFile(filePath, "utf8");
}

async function writeText(filePath, value) {
  await ensureDir(path.dirname(filePath));
  await fs.promises.writeFile(filePath, value, "utf8");
}

module.exports = {
  ensureDir,
  emptyDir,
  copyDirectory,
  pathExists,
  readJson,
  writeJson,
  readText,
  writeText
};
