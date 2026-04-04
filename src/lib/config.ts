import fs from "fs";
import path from "path";
import type {
  AppConfig,
  ModelConfig,
  SanitizedAppConfig,
} from "@/types/config";

let cachedConfig: AppConfig | null = null;

export function loadConfig(): AppConfig {
  if (cachedConfig) return cachedConfig;

  const configPath = path.resolve(process.cwd(), "config.json");

  if (!fs.existsSync(configPath)) {
    throw new Error(
      "config.json not found. Copy config.example.json to config.json and fill in your Azure endpoints."
    );
  }

  const raw = fs.readFileSync(configPath, "utf-8");
  const config: AppConfig = JSON.parse(raw);
  cachedConfig = config;
  return config;
}

export function getModelConfig(modelId: string): ModelConfig | null {
  const config = loadConfig();

  for (const family of Object.values(config.models)) {
    if (!family?.enabled) continue;
    const model = family.models.find((m) => m.id === modelId);
    if (model) return model;
  }

  return null;
}

export function getSanitizedConfig(): SanitizedAppConfig {
  const config = loadConfig();
  const sanitized: SanitizedAppConfig = { models: {} };

  for (const [key, family] of Object.entries(config.models)) {
    if (!family) continue;
    sanitized.models[key as keyof SanitizedAppConfig["models"]] = {
      enabled: family.enabled,
      displayName: family.displayName,
      models: family.models.map((m) => ({
        id: m.id,
        displayName: m.displayName,
      })),
    };
  }

  return sanitized;
}
