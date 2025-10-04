import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

let loaded = false;

const parseLine = (line: string): [string, string] | null => {
  const equalsIndex = line.indexOf("=");
  if (equalsIndex === -1) {
    return null;
  }

  const key = line.slice(0, equalsIndex).trim();
  if (!key || key.startsWith("#")) {
    return null;
  }

  const rawValue = line.slice(equalsIndex + 1).trim();
  const cleanedValue = rawValue.replace(/^['"]|['"]$/g, "");
  return [key, cleanedValue];
};

export const loadEnv = (): void => {
  if (loaded) {
    return;
  }

  loaded = true;

  const require = createRequire(import.meta.url);
  try {
    require("dotenv/config");
    return;
  } catch (error) {
    if (typeof error !== "object" || error === null) {
      throw error;
    }

    const code = (error as { code?: string }).code;
    if (code && code !== "MODULE_NOT_FOUND") {
      throw error;
    }
  }

  const currentDir = dirname(fileURLToPath(import.meta.url));
  const envPath = resolve(currentDir, "../../.env");

  if (!existsSync(envPath)) {
    return;
  }

  const fileContents = readFileSync(envPath, "utf8");
  for (const line of fileContents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const entry = parseLine(trimmed);
    if (!entry) {
      continue;
    }

    const [key, value] = entry;
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
};
