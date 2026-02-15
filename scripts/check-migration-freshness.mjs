/**
 * File: scripts/check-migration-freshness.mjs
 * Module: database
 * Purpose: Ensure migrations are updated whenever entities change.
 * Author: BharatERP
 * created: 2026-02-15
 */

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const ENTITIES_DIR = path.join(ROOT, "src", "database", "entities");
const MIGRATIONS_DIR = path.join(ROOT, "src", "database", "migrations");

async function listFiles(dir, matcher) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const absolutePath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return listFiles(absolutePath, matcher);
      }
      return matcher(entry.name) ? [absolutePath] : [];
    })
  );
  return files.flat();
}

async function newestMtime(files) {
  let newest = 0;
  for (const file of files) {
    const stat = await fs.stat(file);
    newest = Math.max(newest, stat.mtimeMs);
  }
  return newest;
}

function formatTimestamp(value) {
  return new Date(value).toISOString();
}

async function run() {
  const entityFiles = await listFiles(
    ENTITIES_DIR,
    (name) => name.endsWith(".entity.ts")
  );
  const migrationFiles = await listFiles(
    MIGRATIONS_DIR,
    (name) => name.endsWith(".migration.ts")
  );

  if (!entityFiles.length) {
    throw new Error("No entity files found under src/database/entities");
  }
  if (!migrationFiles.length) {
    throw new Error("No migration files found under src/database/migrations");
  }

  const newestEntityTimestamp = await newestMtime(entityFiles);
  const newestMigrationTimestamp = await newestMtime(migrationFiles);

  if (newestEntityTimestamp > newestMigrationTimestamp) {
    throw new Error(
      [
        "Migration freshness check failed.",
        `Newest entity update: ${formatTimestamp(newestEntityTimestamp)}`,
        `Newest migration update: ${formatTimestamp(newestMigrationTimestamp)}`,
        "Generate a new migration before merging entity changes.",
      ].join("\n")
    );
  }

  console.log(
    [
      "Migration freshness check passed.",
      `Entity files: ${entityFiles.length}`,
      `Migration files: ${migrationFiles.length}`,
      `Newest migration: ${formatTimestamp(newestMigrationTimestamp)}`,
    ].join("\n")
  );
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
