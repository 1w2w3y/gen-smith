import { afterEach, describe, expect, it, vi } from "vitest";
import type { ModelConfig } from "@/types/config";

function makeModel(auth: ModelConfig["auth"]): ModelConfig {
  return {
    id: "test-model",
    displayName: "Test Model",
    endpoint: "https://example.com",
    deploymentName: "test-deployment",
    apiVersion: "preview",
    auth,
  };
}

describe("auth", () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock("@azure/identity");
  });

  it("returns configured API keys", async () => {
    const { getApiKey } = await import("@/lib/auth");

    await expect(
      getApiKey(makeModel({ type: "apiKey", apiKey: "test-key" }))
    ).resolves.toBe("test-key");
  });

  it("throws a clear error when API key auth is missing a key", async () => {
    const { getApiKey } = await import("@/lib/auth");

    await expect(getApiKey(makeModel({ type: "apiKey" }))).rejects.toThrow(
      "API key is required for model test-model"
    );
  });

  it("builds api-key headers for API key auth when requested", async () => {
    const { getAuthHeaders } = await import("@/lib/auth");

    await expect(
      getAuthHeaders(makeModel({ type: "apiKey", apiKey: "test-key" }), "api-key")
    ).resolves.toEqual({ "api-key": "test-key" });
  });

  it("builds bearer headers for API key auth by default", async () => {
    const { getAuthHeaders } = await import("@/lib/auth");

    await expect(
      getAuthHeaders(makeModel({ type: "apiKey", apiKey: "test-key" }))
    ).resolves.toEqual({ Authorization: "Bearer test-key" });
  });

  it("always builds bearer headers for Azure CLI tokens", async () => {
    const mockGetToken = vi.fn().mockResolvedValue({ token: "azure-token" });
    vi.doMock("@azure/identity", () => ({
      AzureCliCredential: vi.fn().mockImplementation(function () {
        return {
          getToken: mockGetToken,
        };
      }),
      ManagedIdentityCredential: vi.fn().mockImplementation(function () {
        return {
          getToken: mockGetToken,
        };
      }),
    }));

    const { getAuthHeaders } = await import("@/lib/auth");

    await expect(
      getAuthHeaders(makeModel({ type: "azureCli" }), "api-key")
    ).resolves.toEqual({ Authorization: "Bearer azure-token" });
    expect(mockGetToken).toHaveBeenCalledWith(
      "https://cognitiveservices.azure.com/.default"
    );
  });
});
