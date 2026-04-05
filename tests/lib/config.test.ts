import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AppConfig } from "@/types/config";

// Mock fs module
vi.mock("fs", () => ({
  default: {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
  },
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}));

const ENV_VARS = [
  "GEN_SMITH_GPT_IMAGE_ENDPOINT",
  "GEN_SMITH_GPT_IMAGE_API_KEY",
  "GEN_SMITH_GPT_IMAGE_DEPLOYMENTS",
  "GEN_SMITH_GPT_IMAGE_API_VERSION",
  "GEN_SMITH_GPT_IMAGE_AUTH_TYPE",
  "GEN_SMITH_GPT_IMAGE_CLIENT_ID",
  "GEN_SMITH_FLUX_IMAGE_ENDPOINT",
  "GEN_SMITH_FLUX_IMAGE_API_KEY",
  "GEN_SMITH_FLUX_IMAGE_DEPLOYMENTS",
  "GEN_SMITH_FLUX_IMAGE_API_VERSION",
  "GEN_SMITH_FLUX_IMAGE_AUTH_TYPE",
  "GEN_SMITH_TTS_ENDPOINT",
  "GEN_SMITH_TTS_API_KEY",
  "GEN_SMITH_TTS_DEPLOYMENTS",
  "GEN_SMITH_TTS_API_VERSION",
  "GEN_SMITH_TTS_AUTH_TYPE",
];

const sampleConfig: AppConfig = {
  models: {
    "gpt-image": {
      enabled: true,
      displayName: "GPT Image",
      models: [
        {
          id: "gpt-image-1",
          displayName: "GPT Image 1",
          endpoint: "https://test.openai.azure.com",
          deploymentName: "gpt-image-1",
          apiVersion: "2024-10-21",
          auth: {
            type: "apiKey",
            apiKey: "test-key-123",
          },
        },
        {
          id: "gpt-image-1-mini",
          displayName: "GPT Image 1 Mini",
          endpoint: "https://test.openai.azure.com",
          deploymentName: "gpt-image-1-mini",
          apiVersion: "2024-10-21",
          auth: {
            type: "apiKey",
            apiKey: "test-key-456",
          },
        },
      ],
    },
    "mai-image": {
      enabled: false,
      displayName: "MAI Image",
      models: [],
    },
  },
};

describe("config", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    for (const key of ENV_VARS) {
      delete process.env[key];
    }
  });

  describe("config.json loading", () => {
    it("loads and parses config.json", async () => {
      const fs = await import("fs");
      vi.mocked(fs.default.existsSync).mockReturnValue(true);
      vi.mocked(fs.default.readFileSync).mockReturnValue(
        JSON.stringify(sampleConfig)
      );

      const { loadConfig } = await import("@/lib/config");
      const config = loadConfig();

      expect(config.models["gpt-image"]).toBeDefined();
      expect(config.models["gpt-image"]!.enabled).toBe(true);
      expect(config.models["gpt-image"]!.models).toHaveLength(2);
    });

    it("returns empty config when neither env vars nor config.json exist", async () => {
      const fs = await import("fs");
      vi.mocked(fs.default.existsSync).mockReturnValue(false);

      const { loadConfig } = await import("@/lib/config");
      const config = loadConfig();

      expect(config.models).toEqual({});
    });
  });

  describe("environment variable loading", () => {
    it("loads config from env vars when no config.json exists", async () => {
      process.env.GEN_SMITH_GPT_IMAGE_ENDPOINT = "https://env.openai.azure.com";
      process.env.GEN_SMITH_GPT_IMAGE_API_KEY = "env-key-123";
      process.env.GEN_SMITH_GPT_IMAGE_DEPLOYMENTS = "gpt-image-1,gpt-image-1-mini";

      const fs = await import("fs");
      vi.mocked(fs.default.existsSync).mockReturnValue(false);

      const { loadConfig } = await import("@/lib/config");
      const config = loadConfig();

      expect(config.models["gpt-image"]).toBeDefined();
      expect(config.models["gpt-image"]!.enabled).toBe(true);
      expect(config.models["gpt-image"]!.models).toHaveLength(2);
      expect(config.models["gpt-image"]!.models[0].id).toBe("gpt-image-1");
      expect(config.models["gpt-image"]!.models[0].endpoint).toBe("https://env.openai.azure.com");
      expect(config.models["gpt-image"]!.models[0].auth.type).toBe("apiKey");
      expect(config.models["gpt-image"]!.models[0].auth.apiKey).toBe("env-key-123");
      expect(config.models["gpt-image"]!.models[1].id).toBe("gpt-image-1-mini");
    });

    it("uses default deployments when DEPLOYMENTS env var is not set", async () => {
      process.env.GEN_SMITH_GPT_IMAGE_ENDPOINT = "https://env.openai.azure.com";
      process.env.GEN_SMITH_GPT_IMAGE_API_KEY = "env-key";

      const fs = await import("fs");
      vi.mocked(fs.default.existsSync).mockReturnValue(false);

      const { loadConfig } = await import("@/lib/config");
      const config = loadConfig();

      expect(config.models["gpt-image"]!.models).toHaveLength(1);
      expect(config.models["gpt-image"]!.models[0].id).toBe("gpt-image-1");
    });

    it("uses default API version when not set", async () => {
      process.env.GEN_SMITH_GPT_IMAGE_ENDPOINT = "https://env.openai.azure.com";
      process.env.GEN_SMITH_GPT_IMAGE_API_KEY = "env-key";

      const fs = await import("fs");
      vi.mocked(fs.default.existsSync).mockReturnValue(false);

      const { loadConfig } = await import("@/lib/config");
      const config = loadConfig();

      expect(config.models["gpt-image"]!.models[0].apiVersion).toBe("2024-10-21");
    });

    it("uses custom API version when set", async () => {
      process.env.GEN_SMITH_GPT_IMAGE_ENDPOINT = "https://env.openai.azure.com";
      process.env.GEN_SMITH_GPT_IMAGE_API_KEY = "env-key";
      process.env.GEN_SMITH_GPT_IMAGE_API_VERSION = "2025-01-01";

      const fs = await import("fs");
      vi.mocked(fs.default.existsSync).mockReturnValue(false);

      const { loadConfig } = await import("@/lib/config");
      const config = loadConfig();

      expect(config.models["gpt-image"]!.models[0].apiVersion).toBe("2025-01-01");
    });

    it("supports all three families via env vars", async () => {
      process.env.GEN_SMITH_GPT_IMAGE_ENDPOINT = "https://gpt.openai.azure.com";
      process.env.GEN_SMITH_GPT_IMAGE_API_KEY = "gpt-key";
      process.env.GEN_SMITH_FLUX_IMAGE_ENDPOINT = "https://flux.services.ai.azure.com";
      process.env.GEN_SMITH_FLUX_IMAGE_API_KEY = "flux-key";
      process.env.GEN_SMITH_TTS_ENDPOINT = "https://tts.cognitiveservices.azure.com";
      process.env.GEN_SMITH_TTS_API_KEY = "tts-key";

      const fs = await import("fs");
      vi.mocked(fs.default.existsSync).mockReturnValue(false);

      const { loadConfig } = await import("@/lib/config");
      const config = loadConfig();

      expect(config.models["gpt-image"]).toBeDefined();
      expect(config.models["flux-image"]).toBeDefined();
      expect(config.models["tts"]).toBeDefined();
      expect(config.models["gpt-image"]!.displayName).toBe("GPT Image");
      expect(config.models["flux-image"]!.displayName).toBe("FLUX Image");
      expect(config.models["tts"]!.displayName).toBe("Text to Speech");
    });

    it("trims whitespace from deployment names", async () => {
      process.env.GEN_SMITH_GPT_IMAGE_ENDPOINT = "https://env.openai.azure.com";
      process.env.GEN_SMITH_GPT_IMAGE_API_KEY = "env-key";
      process.env.GEN_SMITH_GPT_IMAGE_DEPLOYMENTS = " gpt-image-1 , gpt-image-1-mini ";

      const fs = await import("fs");
      vi.mocked(fs.default.existsSync).mockReturnValue(false);

      const { loadConfig } = await import("@/lib/config");
      const config = loadConfig();

      expect(config.models["gpt-image"]!.models[0].id).toBe("gpt-image-1");
      expect(config.models["gpt-image"]!.models[1].id).toBe("gpt-image-1-mini");
    });

    it("supports azureCli auth type", async () => {
      process.env.GEN_SMITH_GPT_IMAGE_ENDPOINT = "https://env.openai.azure.com";
      process.env.GEN_SMITH_GPT_IMAGE_AUTH_TYPE = "azureCli";

      const fs = await import("fs");
      vi.mocked(fs.default.existsSync).mockReturnValue(false);

      const { loadConfig } = await import("@/lib/config");
      const config = loadConfig();

      expect(config.models["gpt-image"]!.models[0].auth.type).toBe("azureCli");
      expect(config.models["gpt-image"]!.models[0].auth.apiKey).toBeUndefined();
    });

    it("supports managedIdentity auth type with client ID", async () => {
      process.env.GEN_SMITH_GPT_IMAGE_ENDPOINT = "https://env.openai.azure.com";
      process.env.GEN_SMITH_GPT_IMAGE_AUTH_TYPE = "managedIdentity";
      process.env.GEN_SMITH_GPT_IMAGE_CLIENT_ID = "my-client-id";

      const fs = await import("fs");
      vi.mocked(fs.default.existsSync).mockReturnValue(false);

      const { loadConfig } = await import("@/lib/config");
      const config = loadConfig();

      expect(config.models["gpt-image"]!.models[0].auth.type).toBe("managedIdentity");
      expect(config.models["gpt-image"]!.models[0].auth.clientId).toBe("my-client-id");
    });
  });

  describe("config merging", () => {
    it("config.json takes precedence over env vars for the same family", async () => {
      process.env.GEN_SMITH_GPT_IMAGE_ENDPOINT = "https://env.openai.azure.com";
      process.env.GEN_SMITH_GPT_IMAGE_API_KEY = "env-key";

      const fs = await import("fs");
      vi.mocked(fs.default.existsSync).mockReturnValue(true);
      vi.mocked(fs.default.readFileSync).mockReturnValue(
        JSON.stringify(sampleConfig)
      );

      const { loadConfig } = await import("@/lib/config");
      const config = loadConfig();

      // File config should win
      expect(config.models["gpt-image"]!.models[0].endpoint).toBe("https://test.openai.azure.com");
      expect(config.models["gpt-image"]!.models[0].auth.apiKey).toBe("test-key-123");
    });

    it("merges env families and file families", async () => {
      process.env.GEN_SMITH_FLUX_IMAGE_ENDPOINT = "https://flux.services.ai.azure.com";
      process.env.GEN_SMITH_FLUX_IMAGE_API_KEY = "flux-key";

      const fs = await import("fs");
      vi.mocked(fs.default.existsSync).mockReturnValue(true);
      // File only has gpt-image
      vi.mocked(fs.default.readFileSync).mockReturnValue(
        JSON.stringify(sampleConfig)
      );

      const { loadConfig } = await import("@/lib/config");
      const config = loadConfig();

      // gpt-image from file
      expect(config.models["gpt-image"]).toBeDefined();
      expect(config.models["gpt-image"]!.models[0].endpoint).toBe("https://test.openai.azure.com");
      // flux-image from env
      expect(config.models["flux-image"]).toBeDefined();
      expect(config.models["flux-image"]!.models[0].endpoint).toBe("https://flux.services.ai.azure.com");
    });
  });

  describe("getModelConfig", () => {
    it("finds a model by ID", async () => {
      const fs = await import("fs");
      vi.mocked(fs.default.existsSync).mockReturnValue(true);
      vi.mocked(fs.default.readFileSync).mockReturnValue(
        JSON.stringify(sampleConfig)
      );

      const { getModelConfig } = await import("@/lib/config");
      const model = getModelConfig("gpt-image-1-mini");

      expect(model).toBeDefined();
      expect(model!.id).toBe("gpt-image-1-mini");
      expect(model!.endpoint).toBe("https://test.openai.azure.com");
      expect(model!.auth.apiKey).toBe("test-key-456");
    });

    it("returns null for unknown model ID", async () => {
      const fs = await import("fs");
      vi.mocked(fs.default.existsSync).mockReturnValue(true);
      vi.mocked(fs.default.readFileSync).mockReturnValue(
        JSON.stringify(sampleConfig)
      );

      const { getModelConfig } = await import("@/lib/config");
      const model = getModelConfig("nonexistent-model");

      expect(model).toBeNull();
    });

    it("skips disabled model families when searching", async () => {
      const configWithDisabledModel: AppConfig = {
        models: {
          "gpt-image": {
            enabled: false,
            displayName: "GPT Image",
            models: [
              {
                id: "gpt-image-1",
                displayName: "GPT Image 1",
                endpoint: "https://test.openai.azure.com",
                deploymentName: "gpt-image-1",
                apiVersion: "2024-10-21",
                auth: { type: "apiKey", apiKey: "key" },
              },
            ],
          },
        },
      };

      const fs = await import("fs");
      vi.mocked(fs.default.existsSync).mockReturnValue(true);
      vi.mocked(fs.default.readFileSync).mockReturnValue(
        JSON.stringify(configWithDisabledModel)
      );

      const { getModelConfig } = await import("@/lib/config");
      const model = getModelConfig("gpt-image-1");

      expect(model).toBeNull();
    });
  });

  describe("getSanitizedConfig", () => {
    it("sanitizes config by removing secrets", async () => {
      const fs = await import("fs");
      vi.mocked(fs.default.existsSync).mockReturnValue(true);
      vi.mocked(fs.default.readFileSync).mockReturnValue(
        JSON.stringify(sampleConfig)
      );

      const { getSanitizedConfig } = await import("@/lib/config");
      const sanitized = getSanitizedConfig();

      expect(sanitized.models["gpt-image"]).toBeDefined();
      expect(sanitized.models["gpt-image"]!.models[0].id).toBe("gpt-image-1");
      expect(sanitized.models["gpt-image"]!.models[0].displayName).toBe(
        "GPT Image 1"
      );

      // Should NOT contain secrets
      const stringified = JSON.stringify(sanitized);
      expect(stringified).not.toContain("test-key-123");
      expect(stringified).not.toContain("endpoint");
      expect(stringified).not.toContain("apiKey");
    });
  });
});
