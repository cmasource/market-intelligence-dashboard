import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const roots = ["app", "components", "lib", "docs", "tests"].filter(existsSync);
const extensions = new Set([".ts", ".tsx", ".md"]);
const phrases = [
  "This technical view",
  "Equity-style",
  "Provider underlying",
  "mock local CEDEAR",
  "overbought momentum watch",
  "constructive uptrend",
  "Not an investment recommendation",
  "Mock fallback",
  "Future coverage",
  "Provider price",
];

function extensionFor(path: string) {
  const match = path.match(/\.[^.]+$/);
  return match?.[0] ?? "";
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    const stats = statSync(path);
    if (stats.isDirectory()) {
      if (entry === "node_modules" || entry === ".next" || entry === "test-results") return [];
      return walk(path);
    }
    return extensions.has(extensionFor(path)) ? [path] : [];
  });
}

const findings = roots.flatMap(walk).flatMap((file) => {
  const text = readFileSync(file, "utf8");
  return phrases.flatMap((phrase) => {
    const lines = text.split(/\r?\n/);
    return lines.flatMap((line, index) =>
      line.includes(phrase)
        ? [{
            file: relative(process.cwd(), file),
            line: index + 1,
            phrase,
            text: line.trim(),
          }]
        : [],
    );
  });
});

if (!findings.length) {
  console.log("i18n audit: no configured English phrases found in scanned user-facing files.");
} else {
  console.log(`i18n audit: ${findings.length} finding(s). Review whether each one is English-only UI, test coverage, or docs context.`);
  for (const finding of findings) {
    console.log(`${finding.file}:${finding.line} - "${finding.phrase}" -> ${finding.text}`);
  }
}
