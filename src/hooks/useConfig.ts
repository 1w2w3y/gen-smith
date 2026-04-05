"use client";

import { useState, useEffect } from "react";
import type { SanitizedAppConfig } from "@/types/config";

let configPromise: Promise<SanitizedAppConfig> | null = null;
let cachedResult: SanitizedAppConfig | null = null;

function fetchConfig(): Promise<SanitizedAppConfig> {
  if (!configPromise) {
    configPromise = fetch("/api/config")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load config");
        return res.json();
      })
      .then((data: SanitizedAppConfig) => {
        cachedResult = data;
        return data;
      });
  }
  return configPromise;
}

export function useConfig() {
  const [config, setConfig] = useState<SanitizedAppConfig | null>(cachedResult);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cachedResult) {
      setConfig(cachedResult);
      return;
    }
    fetchConfig()
      .then(setConfig)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load config")
      );
  }, []);

  return { config, error, isLoading: !config && !error };
}

export function isModelFamilyAvailable(
  config: SanitizedAppConfig | null,
  familyKey: keyof SanitizedAppConfig["models"]
): boolean {
  if (!config) return false;
  const family = config.models[familyKey];
  return !!family?.enabled && family.models.length > 0;
}
