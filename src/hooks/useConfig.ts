"use client";

import { useCallback, useState, useEffect } from "react";
import type { SanitizedAppConfig } from "@/types/config";

let configPromise: Promise<SanitizedAppConfig> | null = null;
let cachedResult: SanitizedAppConfig | null = null;
const configListeners = new Set<() => void>();

function emitConfigUpdate() {
  configListeners.forEach((listener) => listener());
}

function fetchConfig(): Promise<SanitizedAppConfig> {
  if (!configPromise) {
    configPromise = fetch("/api/config")
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error?.message || "Failed to load config");
        }
        return res.json();
      })
      .then((data: SanitizedAppConfig) => {
        cachedResult = data;
        emitConfigUpdate();
        return data;
      })
      .catch((err) => {
        // Allow subsequent mounts to retry after a failure
        configPromise = null;
        throw err;
      });
  }
  return configPromise;
}

export function useConfig() {
  const [config, setConfig] = useState<SanitizedAppConfig | null>(cachedResult);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  // A fetch that succeeds in any component updates every mounted consumer
  // (e.g. the Navbar, which mounts once for the whole session).
  useEffect(() => {
    const onConfigUpdate = () => {
      if (cachedResult) {
        setConfig(cachedResult);
        setError(null);
      }
    };
    configListeners.add(onConfigUpdate);
    return () => {
      configListeners.delete(onConfigUpdate);
    };
  }, []);

  useEffect(() => {
    if (config) {
      return;
    }
    let ignore = false;
    fetchConfig()
      .then((data) => {
        if (ignore) return;
        setConfig(data);
        setError(null);
      })
      .catch((err) => {
        if (ignore) return;
        if (attempt === 0) {
          // One automatic retry so transient failures recover without a
          // full page reload.
          setAttempt((a) => a + 1);
        } else {
          setError(err instanceof Error ? err.message : "Failed to load config");
        }
      });
    return () => {
      ignore = true;
    };
  }, [config, attempt]);

  const retry = useCallback(() => {
    setError(null);
    setAttempt((a) => a + 1);
  }, []);

  return { config, error, isLoading: !config && !error, retry };
}

export function isModelFamilyAvailable(
  config: SanitizedAppConfig | null,
  familyKey: keyof SanitizedAppConfig["models"]
): boolean {
  if (!config) return false;
  const family = config.models[familyKey];
  return !!family?.enabled && family.models.length > 0;
}
