/**
 * Keep Tauri + Cargo versions aligned with package.json (for Changesets).
 */
import { readFileSync, writeFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const version = pkg.version;

const tauriPath = "src-tauri/tauri.conf.json";
const tauri = JSON.parse(readFileSync(tauriPath, "utf8"));
tauri.version = version;
writeFileSync(tauriPath, `${JSON.stringify(tauri, null, 2)}\n`);

const cargoPath = "src-tauri/Cargo.toml";
let cargo = readFileSync(cargoPath, "utf8");
cargo = cargo.replace(/^version = ".*"/m, `version = "${version}"`);
writeFileSync(cargoPath, cargo);

console.log(`Synced version ${version} → tauri.conf.json + Cargo.toml`);