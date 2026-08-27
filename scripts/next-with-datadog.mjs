import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd(), process.argv[2] === "dev");

const preload = "--import dd-trace/initialize.mjs";
const existingNodeOptions = process.env.NODE_OPTIONS?.trim();
const nodeOptions = existingNodeOptions?.includes("dd-trace/initialize.mjs")
  ? existingNodeOptions
  : [existingNodeOptions, preload].filter(Boolean).join(" ");
const nextCli = fileURLToPath(
  new URL("../node_modules/next/dist/bin/next", import.meta.url)
);
const result = spawnSync(process.execPath, [nextCli, ...process.argv.slice(2)], {
  stdio: "inherit",
  env: { ...process.env, NODE_OPTIONS: nodeOptions },
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
