/**
 * File: scripts/check-cycles.mjs
 * Module: governance
 * Purpose: Fail when circular dependencies exceed approved baseline.
 * Author: BharatERP
 * created: 2026-02-15
 */
import fs from "node:fs/promises";
import path from "node:path";
import madge from "madge";

const ROOT = process.cwd();
const BASELINE_FILE = path.join(ROOT, "scripts", "madge-cycles-baseline.json");

function normalize(cycle) {
  return cycle.join(" > ");
}

async function run() {
  const baselineRaw = await fs.readFile(BASELINE_FILE, "utf8");
  const baselineCycles = JSON.parse(baselineRaw);
  const baselineSet = new Set(baselineCycles.map(normalize));

  const analysis = await madge("src", { fileExtensions: ["ts"] });
  const currentCycles = analysis.circular();
  const currentSet = new Set(currentCycles.map(normalize));

  const unexpected = [...currentSet].filter((cycle) => !baselineSet.has(cycle));
  if (unexpected.length > 0) {
    throw new Error(
      [
        "Cycle check failed: new circular dependencies detected.",
        ...unexpected.map((cycle) => `- ${cycle}`),
      ].join("\n"),
    );
  }

  const resolved = [...baselineSet].filter((cycle) => !currentSet.has(cycle));
  console.log(
    [
      "Cycle check passed against baseline.",
      `Current cycles: ${currentSet.size}`,
      `Baseline cycles: ${baselineSet.size}`,
      `Resolved cycles: ${resolved.length}`,
    ].join("\n"),
  );
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
