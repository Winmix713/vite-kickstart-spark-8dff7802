#!/usr/bin/env node
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const sourcePath = path.resolve(projectRoot, "models", "model_registry.json");
const publicDir = path.resolve(projectRoot, "public", "models");
const destinationPath = path.join(publicDir, "model_registry.json");

async function syncModelRegistry() {
  const payload = await readFile(sourcePath, "utf-8");
  JSON.parse(payload);

  await mkdir(publicDir, { recursive: true });

  try {
    const existing = await readFile(destinationPath, "utf-8");
    if (existing === payload) {
      console.log("model_registry.json already synced to public/models");
      return;
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }

  await writeFile(destinationPath, payload, "utf-8");
  console.log("Synced model_registry.json to public/models");
}

syncModelRegistry().catch((error) => {
  console.error("Failed to sync model registry:", error);
  process.exit(1);
});
