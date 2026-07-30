#!/usr/bin/env node
/**
 * Compare coverage reports against quality/coverage-baselines.json.
 * Fails if any unit is below its baseline or below absoluteFloor (default 90).
 *
 * Usage:
 *   node quality/compare-coverage.mjs --baselines quality/coverage-baselines.json \
 *     --services path/to/services.cobertura.xml \
 *     --persistence path/to/persistence.cobertura.xml \
 *     --api path/to/api.cobertura.xml \
 *     --front-vue path/to/coverage-summary.json \
 *     --front-react path/to/coverage-summary.json \
 *     --front-angular path/to/coverage-summary.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : null;
}

const absoluteFloor = Number(argValue("--floor") ?? 90);
const baselinesPath = path.resolve(
  root,
  argValue("--baselines") ?? "quality/coverage-baselines.json",
);

const baselines = JSON.parse(fs.readFileSync(baselinesPath, "utf8"));

function parseCobertura(filePath) {
  const xml = fs.readFileSync(filePath, "utf8");
  const line = Number((xml.match(/line-rate="([^"]+)"/) || [])[1] || 0) * 100;
  const branch = Number((xml.match(/branch-rate="([^"]+)"/) || [])[1] || 0) * 100;
  // Coverlet method rate is not always on root; approximate via packages if needed
  const methodMatch = xml.match(/<methods[^>]*\/?>/);
  let method = line;
  const pkgRates = [...xml.matchAll(/<package[^>]*line-rate="([^"]+)"[^>]*branch-rate="([^"]+)"/g)];
  if (pkgRates.length) {
    // keep line/branch from root (first match already taken from document order)
  }
  // Prefer complexity-based method estimate from class method rates if present
  const methods = [...xml.matchAll(/<method[^>]*line-rate="([^"]+)"/g)].map((m) => Number(m[1]));
  if (methods.length) {
    method = (methods.filter((r) => r > 0).length / methods.length) * 100;
  }
  return { line, branch, method };
}

function parseVitestSummary(filePath) {
  const json = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const total = json.total ?? json;
  const pct = (obj) =>
    typeof obj?.pct === "number"
      ? obj.pct
      : typeof obj === "number"
        ? obj
        : 0;
  return {
    lines: pct(total.lines),
    functions: pct(total.functions),
    branches: pct(total.branches),
    statements: pct(total.statements),
  };
}

function checkBackend(unitId, reportPath) {
  if (!reportPath || !fs.existsSync(reportPath)) {
    console.error(`Missing report for ${unitId}: ${reportPath}`);
    return false;
  }
  const current = parseCobertura(reportPath);
  const base = baselines[unitId] || {};
  let ok = true;
  for (const dim of ["line", "branch", "method"]) {
    const c = current[dim];
    const b = Number(base[dim] ?? 0);
    if (c < absoluteFloor) {
      console.error(`${unitId}.${dim}=${c.toFixed(2)} < floor ${absoluteFloor}`);
      ok = false;
    }
    if (c + 0.01 < b) {
      console.error(`${unitId}.${dim}=${c.toFixed(2)} < baseline ${b}`);
      ok = false;
    } else {
      console.log(`${unitId}.${dim}=${c.toFixed(2)} (baseline ${b}) OK`);
    }
  }
  return ok;
}

function checkFront(unitId, reportPath) {
  if (!reportPath || !fs.existsSync(reportPath)) {
    console.error(`Missing report for ${unitId}: ${reportPath}`);
    return false;
  }
  const current = parseVitestSummary(reportPath);
  const base = baselines[unitId] || {};
  let ok = true;
  for (const dim of ["lines", "functions", "branches", "statements"]) {
    const c = current[dim];
    const b = Number(base[dim] ?? 0);
    if (c < absoluteFloor) {
      console.error(`${unitId}.${dim}=${c.toFixed(2)} < floor ${absoluteFloor}`);
      ok = false;
    }
    if (c + 0.01 < b) {
      console.error(`${unitId}.${dim}=${c.toFixed(2)} < baseline ${b}`);
      ok = false;
    } else {
      console.log(`${unitId}.${dim}=${c.toFixed(2)} (baseline ${b}) OK`);
    }
  }
  return ok;
}

const checks = [
  checkBackend("services", argValue("--services")),
  checkBackend("persistence-domain", argValue("--persistence")),
  checkBackend("api-crosscutting", argValue("--api")),
  checkFront("front-vue", argValue("--front-vue")),
  checkFront("front-react", argValue("--front-react")),
  checkFront("front-angular", argValue("--front-angular")),
];

if (checks.some((c) => !c)) {
  process.exit(1);
}
console.log("All coverage units meet floor and baselines.");
