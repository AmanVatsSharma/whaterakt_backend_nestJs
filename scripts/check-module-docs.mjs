/**
 * File: scripts/check-module-docs.mjs
 * Module: governance
 * Purpose: Validate module docs and changelog coverage for backend modules.
 * Author: BharatERP
 * created: 2026-02-15
 */
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, "src");
const MODULES_DIR = path.join(SRC_DIR, "modules");

async function exists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function listFiles(dir, predicate) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const rows = await Promise.all(
    entries.map(async (entry) => {
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return listFiles(absolute, predicate);
      }
      return predicate(entry.name, absolute) ? [absolute] : [];
    }),
  );
  return rows.flat();
}

async function run() {
  const moduleDirectories = (await fs.readdir(MODULES_DIR, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(MODULES_DIR, entry.name));

  const missingDocs = [];
  for (const moduleDir of moduleDirectories) {
    const moduleDocPath = path.join(moduleDir, "MODULE_DOC.md");
    if (!(await exists(moduleDocPath))) {
      missingDocs.push(path.relative(ROOT, moduleDir));
    }
  }
  if (missingDocs.length > 0) {
    throw new Error(
      `Missing MODULE_DOC.md in module directories: ${missingDocs.join(", ")}`,
    );
  }

  const moduleDocFiles = await listFiles(
    SRC_DIR,
    (name) => name.toLowerCase() === "module_doc.md",
  );
  const withoutChangelog = [];
  for (const filePath of moduleDocFiles) {
    const content = await fs.readFile(filePath, "utf8");
    if (!/change-log\s*:/i.test(content)) {
      withoutChangelog.push(path.relative(ROOT, filePath));
    }
  }
  if (withoutChangelog.length > 0) {
    throw new Error(
      `MODULE_DOC files missing Change-log section: ${withoutChangelog.join(", ")}`,
    );
  }

  console.log(
    [
      "Module doc checks passed.",
      `Modules checked: ${moduleDirectories.length}`,
      `MODULE_DOC files checked: ${moduleDocFiles.length}`,
    ].join("\n"),
  );
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
