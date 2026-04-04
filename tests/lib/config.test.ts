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
  });

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

  it("throws when config.json is missing", async () => {
    const fs = await import("fs");
    vi.mocked(fs.default.existsSync).mockReturnValue(false);

    const { loadConfig } = await import("@/lib/config");

    expect(() => loadConfig()).toThrow("config.json not found");
  });

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
