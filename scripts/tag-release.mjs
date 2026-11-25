import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const version = JSON.parse(readFileSync("package.json", "utf8")).version;
const tag = `v${version}`;

const existing = execSync("git tag -l", { encoding: "utf8" })
  .split("\n")
  .map((t) => t.trim())
  .filter(Boolean);
if (existing.includes(tag)) {
  console.log(`Tag ${tag} already exists — skip`);
  process.exit(0);
}

execSync(`git tag ${tag}`, { stdio: "inherit" });
execSync(`git push origin ${tag}`, { stdio: "inherit" });
console.log(`Pushed ${tag}`);