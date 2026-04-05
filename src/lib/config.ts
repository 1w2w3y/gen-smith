import fs from "fs";
import path from "path";
import type {
  AppConfig,
  AuthType,
  ModelConfig,
  ModelFamilyConfig,
  SanitizedAppConfig,
} from "@/types/config";

let cachedConfig: AppConfig | null = null;

const ENV_FAMILIES = [
  {
    key: "gpt-image" as const,
    prefix: "GEN_SMITH_GPT_IMAGE",
    displayName: "GPT Image",
    defaultDeployments: ["gpt-image-1"],
    defaultApiVersion: "2024-10-21",
  },
  {
    key: "flux-image" as const,
    prefix: "GEN_SMITH_FLUX_IMAGE",
    displayName: "FLUX Image",
    defaultDeployments: ["FLUX.2-pro:flux-2-pro"],
    defaultApiVersion: "preview",
  },
  {
    key: "tts" as const,
    prefix: "GEN_SMITH_TTS",
    displayName: "Text to Speech",
    defaultDeployments: ["gpt-4o-mini-tts"],
    defaultApiVersion: "2025-03-01-preview",
  },
] as const;

function loadConfigFromEnv(): AppConfig | null {
  const models: AppConfig["models"] = {};
  let hasAny = false;

  for (const family of ENV_FAMILIES) {
    const endpoint = process.env[`${family.prefix}_ENDPOINT`];
    if (!endpoint) continue;

    hasAny = true;

    const authType = (process.env[`${family.prefix}_AUTH_TYPE`] || "apiKey") as AuthType;
    const apiKey = process.env[`${family.prefix}_API_KEY`] || "";
    const clientId = process.env[`${family.prefix}_CLIENT_ID`];
    const apiVersion = process.env[`${family.prefix}_API_VERSION`] || family.defaultApiVersion;

    const deploymentsRaw = process.env[`${family.prefix}_DEPLOYMENTS`];
    const deployments = deploymentsRaw
      ? deploymentsRaw.split(",").map((d) => d.trim()).filter(Boolean)
      : [...family.defaultDeployments];

    // Support "id:deploymentName" syntax (e.g. "FLUX.2-pro:flux-2-pro")
    const familyModels: ModelConfig[] = deployments.map((entry) => {
      const colonIdx = entry.indexOf(":");
      const id = colonIdx >= 0 ? entry.slice(0, colonIdx) : entry;
      const deploymentName = colonIdx >= 0 ? entry.slice(colonIdx + 1) : entry;
      return {
        id,
        displayName: id,
        endpoint,
        deploymentName,
        apiVersion,
        auth: {
          type: authType,
          ...(authType === "apiKey" ? { apiKey } : {}),
          ...(clientId ? { clientId } : {}),
        },
      };
    });

    models[family.key] = {
      enabled: true,
      displayName: family.displayName,
      models: familyModels,
    };
  }

  return hasAny ? { models } : null;
}

function loadConfigFromFile(): AppConfig | null {
  const configPath = path.resolve(process.cwd(), "config.json");
  if (!fs.existsSync(configPath)) return null;

  const raw = fs.readFileSync(configPath, "utf-8");
  return JSON.parse(raw) as AppConfig;
}

export function loadConfig(): AppConfig {
  if (cachedConfig) return cachedConfig;

  const envConfig = loadConfigFromEnv();
  const fileConfig = loadConfigFromFile();

  if (!envConfig && !fileConfig) {
    cachedConfig = { models: {} };
    return cachedConfig;
  }

  if (!envConfig) {
    cachedConfig = fileConfig!;
    return cachedConfig;
  }

  if (!fileConfig) {
    cachedConfig = envConfig;
    return cachedConfig;
  }

  // Both exist: config.json wins per-family
  const merged: AppConfig = { models: {} };
  const allKeys = new Set([
    ...Object.keys(envConfig.models),
    ...Object.keys(fileConfig.models),
  ]);

  for (const key of allKeys) {
    const k = key as keyof AppConfig["models"];
    merged.models[k] = fileConfig.models[k] ?? envConfig.models[k];
  }

  cachedConfig = merged;
  return cachedConfig;
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
